"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, Medal, Award, Filter, ArrowUpDown, Search, ChevronDown } from "lucide-react"
import { Flask, Atom, MathOperations, Target, Checks } from "phosphor-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface LeaderboardEntry {
  rank: number
  userId: {
    _id: string
    name: string
    profilePicture: string
  }
  totalMarkScored: number
  accuracy: number
  subjects: Array<{
    subjectId: {
      _id: string
      title: string
    }
    totalMarkScored: number
    accuracy: number
  }>
  marksGained: number
  marksLost: number
  unansweredMarks: number
}

interface ProcessedStudent {
  id: string
  name: string
  rank: number
  rankSuffix: string
  overallScore: number
  maxScore: number
  physicsScore: number
  chemScore: number
  mathsScore: number
  accuracy: number
  avatar: string
  borderColor: string
  bgColor: string
}

interface TableStudent {
  id: string
  rank: number
  name: string
  overallScore: number
  maxScore: number
  accuracy: number
  avatar: string
  subjects: Array<{
    name: string
    score: number
    color: string
    icon: any
  }>
}

interface SubjectConfig {
  id: string
  name: string
  shortName: string
  color: string
  icon: any
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topStudents, setTopStudents] = useState<ProcessedStudent[]>([])
  const [tableStudents, setTableStudents] = useState<TableStudent[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [currentUser, setCurrentUser] = useState<TableStudent | null>(null)
  const [subjectConfigs, setSubjectConfigs] = useState<SubjectConfig[]>([])
  const [scrollLeft, setScrollLeft] = useState(0)
  const [allPageStudents, setAllPageStudents] = useState<TableStudent[]>([])
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'accuracy' | 'physics' | 'chemistry' | 'maths'>('rank')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [minScore, setMinScore] = useState<number | null>(null)
  const [maxScore, setMaxScore] = useState<number | null>(null)
  const [minAccuracy, setMinAccuracy] = useState<number | null>(null)
  const [maxAccuracy, setMaxAccuracy] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    fetchLeaderboardData()
  }, [currentPage])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Default subject configuration for PCM
  const defaultSubjectConfigs: SubjectConfig[] = [
    { id: 'physics', name: 'Physics', shortName: 'Phy', color: '#009966', icon: Atom },
    { id: 'chemistry', name: 'Chemistry', shortName: 'Chem', color: '#f54a00', icon: Flask },
    { id: 'mathematics', name: 'Mathematics', shortName: 'Maths', color: '#155dfc', icon: MathOperations }
  ]

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/leaderboard?page=${currentPage}&limit=10`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("API Response:", data)

      if (data.success && data.data && data.data.results) {
        const leaderboardData = data.data.results as LeaderboardEntry[]
        
        // Process data for top 3 students plus current user (rank 8)
        let processedTopStudents: ProcessedStudent[] = []
        
        // Always show top 3 cards on every page
        if (currentPage === 1) {
          // On page 1, use current data
          processedTopStudents = leaderboardData.slice(0, 3).map((student, index) => {
            const rankSuffix = getRankSuffix(student.rank)
            const physicsData = student.subjects?.find(s => s.subjectId.title === "Physics") || { totalMarkScored: 0 }
            const chemData = student.subjects?.find(s => s.subjectId.title === "Chemistry") || { totalMarkScored: 0 }
            const mathsData = student.subjects?.find(s => s.subjectId.title === "Mathematics") || { totalMarkScored: 0 }

            return {
              id: student.userId._id,
              name: student.userId.name,
              rank: student.rank,
              rankSuffix: rankSuffix,
              overallScore: Math.round(student.totalMarkScored),
              maxScore: 300,
              physicsScore: Math.round(physicsData.totalMarkScored),
              chemScore: Math.round(chemData.totalMarkScored),
              mathsScore: Math.round(mathsData.totalMarkScored),
              accuracy: parseFloat(student.accuracy.toFixed(2)),
              avatar: student.userId.profilePicture || `/placeholder.svg`,
              borderColor: index === 0 ? "border-[#ffac33]" : index === 1 ? "border-[#ccd6dd]" : "border-[#F54A00]",
              bgColor: index === 0 ? "bg-[#fef9c2]" : index === 1 ? "bg-[#f5f9fe]" : "bg-gradient-to-b from-[#FFE4D8] to-white",
            }
          })
          
          // Find rank 8 student for the 4th card (current user)
          const rank8Student = leaderboardData.find(s => s.rank === 8)
          if (rank8Student) {
            const rankSuffix = getRankSuffix(rank8Student.rank)
            const physicsData = rank8Student.subjects?.find(s => s.subjectId.title === "Physics") || { totalMarkScored: 0 }
            const chemData = rank8Student.subjects?.find(s => s.subjectId.title === "Chemistry") || { totalMarkScored: 0 }
            const mathsData = rank8Student.subjects?.find(s => s.subjectId.title === "Mathematics") || { totalMarkScored: 0 }
            
            processedTopStudents.push({
              id: rank8Student.userId._id,
              name: rank8Student.userId.name,
              rank: rank8Student.rank,
              rankSuffix: rankSuffix,
              overallScore: Math.round(rank8Student.totalMarkScored),
              maxScore: 300,
              physicsScore: Math.round(physicsData.totalMarkScored),
              chemScore: Math.round(chemData.totalMarkScored),
              mathsScore: Math.round(mathsData.totalMarkScored),
              accuracy: parseFloat(rank8Student.accuracy.toFixed(2)),
              avatar: rank8Student.userId.profilePicture || `/placeholder.svg`,
              borderColor: "border-[#b5b7c0]",
              bgColor: "bg-[#ffffff]"
            })
          }
          setTopStudents(processedTopStudents)
        } else {
          // On other pages, fetch top 3 and rank 8 from page 1
          fetch(`/api/leaderboard?page=1&limit=10`)
            .then(res => res.json())
            .then(data => {
              if (data.success && data.data && data.data.results) {
                const page1Data = data.data.results as LeaderboardEntry[]
                
                // Process top 3
                const top3 = page1Data.slice(0, 3).map((student, index) => {
                  const rankSuffix = getRankSuffix(student.rank)
                  const physicsData = student.subjects?.find(s => s.subjectId.title === "Physics") || { totalMarkScored: 0 }
                  const chemData = student.subjects?.find(s => s.subjectId.title === "Chemistry") || { totalMarkScored: 0 }
                  const mathsData = student.subjects?.find(s => s.subjectId.title === "Mathematics") || { totalMarkScored: 0 }

                  return {
                    id: student.userId._id,
                    name: student.userId.name,
                    rank: student.rank,
                    rankSuffix: rankSuffix,
                    overallScore: Math.round(student.totalMarkScored),
                    maxScore: 300,
                    physicsScore: Math.round(physicsData.totalMarkScored),
                    chemScore: Math.round(chemData.totalMarkScored),
                    mathsScore: Math.round(mathsData.totalMarkScored),
                    accuracy: parseFloat(student.accuracy.toFixed(2)),
                    avatar: student.userId.profilePicture || `/placeholder.svg`,
                    borderColor: index === 0 ? "border-[#ffac33]" : index === 1 ? "border-[#ccd6dd]" : "border-[#F54A00]",
                    bgColor: index === 0 ? "bg-[#fef9c2]" : index === 1 ? "bg-[#f5f9fe]" : "bg-gradient-to-b from-[#FFE4D8] to-white",
                  }
                })
                
                // Add rank 8
                const rank8Student = page1Data.find(s => s.rank === 8)
                if (rank8Student) {
                  const rankSuffix = getRankSuffix(rank8Student.rank)
                  const physicsData = rank8Student.subjects?.find(s => s.subjectId.title === "Physics") || { totalMarkScored: 0 }
                  const chemData = rank8Student.subjects?.find(s => s.subjectId.title === "Chemistry") || { totalMarkScored: 0 }
                  const mathsData = rank8Student.subjects?.find(s => s.subjectId.title === "Mathematics") || { totalMarkScored: 0 }
                  
                  top3.push({
                    id: rank8Student.userId._id,
                    name: rank8Student.userId.name,
                    rank: rank8Student.rank,
                    rankSuffix: rankSuffix,
                    overallScore: Math.round(rank8Student.totalMarkScored),
                    maxScore: 300,
                    physicsScore: Math.round(physicsData.totalMarkScored),
                    chemScore: Math.round(chemData.totalMarkScored),
                    mathsScore: Math.round(mathsData.totalMarkScored),
                    accuracy: parseFloat(rank8Student.accuracy.toFixed(2)),
                    avatar: rank8Student.userId.profilePicture || `/placeholder.svg`,
                    borderColor: "border-[#b5b7c0]",
                    bgColor: "bg-[#ffffff]"
                  })
                }
                
                setTopStudents(top3)
              }
            })
            .catch(err => console.error('Failed to fetch top students:', err))
        }

        // Set subject configs if not already set
        if (subjectConfigs.length === 0) {
          setSubjectConfigs(defaultSubjectConfigs)
        }

        // Process data for table
        // On desktop: skip first 3 ranks (they're shown in cards)
        // On mobile: show all ranks
        const tableStartIndex = 0 // Will be determined by screen size in component
        const processedTableStudents = leaderboardData.map((student) => {
          const subjects = defaultSubjectConfigs.map(config => {
            const subjectData = student.subjects?.find(s => s.subjectId.title === config.name) || { totalMarkScored: 0 }
            return {
              name: config.shortName,
              score: Math.round(subjectData.totalMarkScored),
              color: config.color,
              icon: config.icon
            }
          })

          return {
            id: student.userId._id,
            rank: student.rank,
            name: student.userId.name,
            overallScore: Math.round(student.totalMarkScored),
            maxScore: 300,
            accuracy: parseFloat(student.accuracy.toFixed(2)),
            avatar: student.userId.profilePicture || `/placeholder.svg`,
            subjects
          }
        })

        // Set the current user (rank 8) - fetch from page 1 if not on current page
        const currentUserData = processedTableStudents.find(s => s.rank === 8)
        if (currentUserData) {
          setCurrentUser({
            ...currentUserData,
            name: currentUserData.name 
          })
        } else if (currentPage !== 1) {
          // Fetch rank 8 data from page 1 to show on every page
          fetch(`/api/leaderboard?page=1&limit=10`)
            .then(res => res.json())
            .then(data => {
              if (data.success && data.data && data.data.results) {
                const rank8Data = data.data.results.find((s: LeaderboardEntry) => s.rank === 8)
                if (rank8Data) {
                  const subjects = defaultSubjectConfigs.map(config => {
                    const subjectData = rank8Data.subjects?.find(s => s.subjectId.title === config.name) || { totalMarkScored: 0 }
                    return {
                      name: config.shortName,
                      score: Math.round(subjectData.totalMarkScored),
                      color: config.color,
                      icon: config.icon
                    }
                  })
                  
                  setCurrentUser({
                    id: rank8Data.userId._id,
                    rank: rank8Data.rank,
                    name: rank8Data.userId.name + " (You)",
                    overallScore: Math.round(rank8Data.totalMarkScored),
                    maxScore: 300,
                    accuracy: parseFloat(rank8Data.accuracy.toFixed(2)),
                    avatar: rank8Data.userId.profilePicture || `/placeholder.svg`,
                    subjects
                  })
                }
              }
            })
            .catch(err => console.error('Failed to fetch current user data:', err))
        } else {
          setCurrentUser(null)
        }

        // Store all students for the current page
        setAllPageStudents(processedTableStudents)
        
        // Apply filters and sorting
        applyFiltersAndSorting(processedTableStudents)
        
        // Calculate total pages (10 items per page)
        const totalItems = data.data.totalCount || 100 // Example: 100 total students
        setTotalPages(Math.ceil(totalItems / 10))
      } else {
        // Handle no data case
        console.warn("API returned no data")
        setTopStudents([])
        setTableStudents([])
      }
    } catch (error) {
      console.error("Error fetching leaderboard data:", error)
      setError("Failed to fetch leaderboard data")
      setTopStudents([])
      setTableStudents([])
    } finally {
      setLoading(false)
    }
  }


  const getRankSuffix = (rank: number) => {
    if (rank === 1) return "st"
    if (rank === 2) return "nd"
    if (rank === 3) return "rd"
    return "th"
  }

  const applyFiltersAndSorting = (students: TableStudent[]) => {
    let filtered = [...students]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply score filter
    if (minScore !== null) {
      filtered = filtered.filter(student => student.overallScore >= minScore)
    }
    if (maxScore !== null) {
      filtered = filtered.filter(student => student.overallScore <= maxScore)
    }

    // Apply accuracy filter
    if (minAccuracy !== null) {
      filtered = filtered.filter(student => student.accuracy >= minAccuracy)
    }
    if (maxAccuracy !== null) {
      filtered = filtered.filter(student => student.accuracy <= maxAccuracy)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0
      
      switch (sortBy) {
        case 'rank':
          compareValue = a.rank - b.rank
          break
        case 'score':
          compareValue = a.overallScore - b.overallScore
          break
        case 'accuracy':
          compareValue = a.accuracy - b.accuracy
          break
        case 'physics':
          compareValue = (a.subjects.find(s => s.name === 'Phy')?.score || 0) - 
                        (b.subjects.find(s => s.name === 'Phy')?.score || 0)
          break
        case 'chemistry':
          compareValue = (a.subjects.find(s => s.name === 'Chem')?.score || 0) - 
                        (b.subjects.find(s => s.name === 'Chem')?.score || 0)
          break
        case 'maths':
          compareValue = (a.subjects.find(s => s.name === 'Maths')?.score || 0) - 
                        (b.subjects.find(s => s.name === 'Maths')?.score || 0)
          break
      }

      return sortOrder === 'asc' ? compareValue : -compareValue
    })

    setTableStudents(filtered)
  }

  useEffect(() => {
    applyFiltersAndSorting(allPageStudents)
  }, [sortBy, sortOrder, searchQuery, minScore, maxScore, minAccuracy, maxAccuracy, allPageStudents])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#432dd7] mx-auto mb-4"></div>
          <p className="text-[#5b6480] dark:text-gray-400">Loading leaderboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#ffffff] p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => fetchLeaderboardData()} className="bg-[#432dd7] text-white hover:bg-[#432dd7]/90 dark:bg-[#432dd7] dark:hover:bg-[#432dd7]/80">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-6 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div 
          className="fixed top-0 left-0 right-0 z-50 h-[180px] border-b dark:border-gray-700"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottomColor: '#E5E7EB',
            borderBottomWidth: '1px'
          }}
        >
          <div className="dark:bg-gray-900/80 h-full flex items-center backdrop-blur-xl">
            <div className="max-w-7xl mx-auto w-full px-6">
              <div className="flex flex-col gap-[16px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="text-[#5b6480] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-semibold text-[#1d2933] dark:text-gray-100">Leaderboard</h1>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#5b6480] dark:text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search student..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-[#b5b7c0] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1d2933] dark:text-gray-100 placeholder-[#5b6480] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#432dd7] text-sm"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowFilters(!showFilters)}
                      className="text-[#5b6480] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Filter className="h-5 w-5" />
                    </Button>
                    <ThemeToggle />
                  </div>
                </div>
                <div className="text-sm text-[#5b6480] dark:text-gray-400 ml-12">
                  JEE Main Test series / Quant Part Test / Quant Part Test (QPT) - 1 (Old) / Analysis / Leaderboard
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Spacer for fixed header */}
        <div className="h-[180px]"></div>

        {/* Filter Panel - Modern Dropdown */}
        {showFilters && (
          <div className="absolute top-[140px] right-6 z-40 w-96">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#432dd7] to-[#6b46ff] p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold text-lg">Filters & Sorting</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFilters(false)}
                    className="text-white hover:bg-white/20 h-8 w-8"
                  >
                    ×
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Sorting Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Sort Options
                  </h4>
                  <div className="space-y-3">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-0 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#432dd7] transition-all"
                    >
                      <option value="rank">Rank</option>
                      <option value="score">Overall Score</option>
                      <option value="accuracy">Accuracy</option>
                      <option value="physics">Physics Score</option>
                      <option value="chemistry">Chemistry Score</option>
                      <option value="maths">Maths Score</option>
                    </select>
                    
                    <div className="flex gap-2">
                      <Button
                        variant={sortOrder === 'asc' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortOrder('asc')}
                        className={sortOrder === 'asc' ? 'flex-1 bg-[#432dd7] hover:bg-[#432dd7]/90' : 'flex-1'}
                      >
                        ↑ Ascending
                      </Button>
                      <Button
                        variant={sortOrder === 'desc' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortOrder('desc')}
                        className={sortOrder === 'desc' ? 'flex-1 bg-[#432dd7] hover:bg-[#432dd7]/90' : 'flex-1'}
                      >
                        ↓ Descending
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Filter Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter Criteria
                  </h4>
                  
                  {/* Score Range */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Score Range</label>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            placeholder="0"
                            value={minScore || ''}
                            onChange={(e) => setMinScore(e.target.value ? Number(e.target.value) : null)}
                            className="w-full pl-8 pr-3 py-3 bg-gray-50 dark:bg-gray-700/50 border-0 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#432dd7] transition-all"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">≥</span>
                        </div>
                        <div className="text-gray-400">to</div>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            placeholder="300"
                            value={maxScore || ''}
                            onChange={(e) => setMaxScore(e.target.value ? Number(e.target.value) : null)}
                            className="w-full pl-8 pr-3 py-3 bg-gray-50 dark:bg-gray-700/50 border-0 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#432dd7] transition-all"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">≤</span>
                        </div>
                      </div>
                    </div>

                    {/* Accuracy Range */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Accuracy Range</label>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            placeholder="0"
                            value={minAccuracy || ''}
                            onChange={(e) => setMinAccuracy(e.target.value ? Number(e.target.value) : null)}
                            className="w-full pl-8 pr-8 py-3 bg-gray-50 dark:bg-gray-700/50 border-0 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#432dd7] transition-all"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">≥</span>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                        </div>
                        <div className="text-gray-400">to</div>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            placeholder="100"
                            value={maxAccuracy || ''}
                            onChange={(e) => setMaxAccuracy(e.target.value ? Number(e.target.value) : null)}
                            className="w-full pl-8 pr-8 py-3 bg-gray-50 dark:bg-gray-700/50 border-0 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#432dd7] transition-all"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">≤</span>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 space-y-3">
                  <Button
                    onClick={() => {
                      setSearchQuery('')
                      setMinScore(null)
                      setMaxScore(null)
                      setMinAccuracy(null)
                      setMaxAccuracy(null)
                      setSortBy('rank')
                      setSortOrder('asc')
                    }}
                    variant="outline"
                    className="w-full border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    Reset All
                  </Button>
                  <Button
                    onClick={() => setShowFilters(false)}
                    className="w-full bg-[#432dd7] hover:bg-[#432dd7]/90"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Students Cards - Hidden on mobile */}
        <div className="hidden lg:grid grid-cols-4 gap-6 mb-8">
          {topStudents.length > 0 ? (topStudents.slice(0, 4).map((student, index) => (
            <div key={`top-${student.rank}-${student.id}`}>
              {index === 0 ? (
                // Custom 1st card with gradient border
                <div className="relative w-[264px] h-[392px]">
                  <div 
                    className="absolute inset-0 rounded-t-3xl p-[1px]"
                    style={{
                      background: isDarkMode
                        ? 'linear-gradient(180deg, #FFC721 0%, #1B2126 100%)'
                        : 'linear-gradient(to bottom, rgba(255, 199, 33, 1), rgba(255, 255, 255, 1))',
                    }}
                  >
                    <div 
                      className="relative h-full rounded-t-3xl p-6"
                      style={{
                        background: isDarkMode
                          ? 'linear-gradient(180deg, #332600 0%, #1B2126 100%)'
                          : 'linear-gradient(to bottom, rgba(255, 247, 222, 1), rgba(255, 255, 255, 1))',
                      }}
                    >
                      <div className="flex flex-col items-center text-center h-full">
                        <div className="relative mb-3">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                            <AvatarFallback className="bg-[#b5b7c0] text-white">{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1">
                            <svg width="13" height="34" viewBox="0 0 13 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                              {/* Ribbon */}
                              <path d="M1 10 L1 34 L6.5 30 L12 34 L12 10" fill="#FF9500"/>
                              {/* Medal */}
                              <circle cx="6.5" cy="6.5" r="6" fill="#FFB800" stroke="#FF8500" strokeWidth="0.5"/>
                              {/* Number 1 */}
                              <text x="6.5" y="9.5" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="Arial">1</text>
                            </svg>
                          </div>
                        </div>
                        <h3 className="font-bold text-[#1d2933] dark:text-white text-sm mb-1">{student.name}</h3>
                        <div className="w-[80px] h-[28px] bg-[#FFF7DE] dark:bg-[#FFB800]/20 rounded-[16px] px-[12px] py-[4px] flex items-center justify-center gap-1 mb-6">
                          <span className="text-sm text-[#D97706] dark:text-[#FFB800] font-medium">
                            {student.rank}<sup>{student.rankSuffix}</sup> Rank
                          </span>
                        </div>
                        
                        <div className="w-full space-y-3 text-xs mt-auto">
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <Checks size={16} color="#5b6480" weight="regular" />
                              Overall Score
                            </span>
                            <div className="flex items-center gap-0.5">
                              <span className="font-bold text-[#1d2933] dark:text-white text-base">{student.overallScore}</span>
                              <span className="font-medium text-[#5B6480] dark:text-gray-400 text-xs">/{student.maxScore}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <Atom size={16} color="#009966" weight="regular" />
                              Phy Score
                            </span>
                            <span className="font-semibold text-[#1d2933] dark:text-white">{student.physicsScore}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <Flask size={16} color="#F54A00" weight="regular" />
                              Chem Score
                            </span>
                            <span className="font-semibold text-[#1d2933] dark:text-white">{student.chemScore}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <MathOperations size={16} color="#155dfc" weight="regular" />
                              Maths Score
                            </span>
                            <span className="font-semibold text-[#1d2933] dark:text-white">{student.mathsScore}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <Target size={16} color="#e60076" weight="regular" />
                              Accuracy
                            </span>
                            <span className="font-semibold text-[#1d2933] dark:text-white">{student.accuracy}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : index === 1 ? (
                // Custom 2nd card with gradient border
                <div className="relative w-[264px] h-[392px]">
                  <div 
                    className="absolute inset-0 rounded-t-3xl p-[1px]"
                    style={{
                      background: isDarkMode
                        ? 'linear-gradient(180deg, #6A869E 0%, #1B2126 100%)'
                        : 'linear-gradient(to bottom, rgba(133, 147, 164, 1), rgba(255, 255, 255, 1))',
                    }}
                  >
                    <div 
                      className="relative h-full rounded-t-3xl p-6"
                      style={{
                        background: isDarkMode
                          ? 'linear-gradient(180deg, #2C323A 0%, #1B2126 100%)'
                          : 'linear-gradient(to bottom, rgba(236, 238, 241, 1), rgba(255, 255, 255, 1))',
                      }}
                    >
                      <div className="flex flex-col items-center text-center h-full">
                        <div className="relative mb-3">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                            <AvatarFallback className="bg-[#b5b7c0] text-white">{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 bg-[#94A3B8] rounded-full p-1">
                            <Medal className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <h3 className="font-bold text-[#1d2933] dark:text-white text-sm mb-1">{student.name}</h3>
                        <div className="w-[80px] h-[28px] bg-[#E8EEFF] dark:bg-[#94A3B8]/20 rounded-[16px] px-[12px] py-[4px] flex items-center justify-center gap-1 mb-6">
                          <span className="text-sm text-[#4A5568] dark:text-[#94A3B8] font-medium">
                            {student.rank}<sup>{student.rankSuffix}</sup> Rank
                          </span>
                        </div>
                        
                        <div className="w-full space-y-3 text-xs mt-auto">
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <Checks size={16} color="#5b6480" weight="regular" />
                              Overall Score
                            </span>
                            <div className="flex items-center gap-0.5">
                              <span className="font-bold text-[#1d2933] dark:text-white text-base">{student.overallScore}</span>
                              <span className="font-medium text-[#5B6480] dark:text-gray-400 text-xs">/{student.maxScore}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <Atom size={16} color="#009966" weight="regular" />
                              Phy Score
                            </span>
                            <span className="font-semibold text-[#1d2933] dark:text-white">{student.physicsScore}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <Flask size={16} color="#F54A00" weight="regular" />
                              Chem Score
                            </span>
                            <span className="font-semibold text-[#1d2933] dark:text-white">{student.chemScore}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <MathOperations size={16} color="#155dfc" weight="regular" />
                              Maths Score
                            </span>
                            <span className="font-semibold text-[#1d2933] dark:text-white">{student.mathsScore}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <Target size={16} color="#e60076" weight="regular" />
                              Accuracy
                            </span>
                            <span className="font-semibold text-[#1d2933] dark:text-white">{student.accuracy}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : index === 2 ? (
                // Custom 3rd card with gradient border
                <div className="relative w-[264px] h-[392px]">
                  <div 
                    className="absolute inset-0 rounded-t-3xl rounded-br-3xl p-[1px]"
                    style={{
                      background: isDarkMode
                        ? 'linear-gradient(180deg, #FFB86A 0%, #1B2126 100%)'
                        : 'linear-gradient(to bottom, #F54A00, #FFFFFF)',
                    }}
                  >
                    <div 
                      className="relative h-full rounded-t-3xl rounded-br-3xl p-6"
                      style={{
                        background: isDarkMode
                          ? 'linear-gradient(180deg, #330F00 0%, #1B2126 100%)'
                          : 'linear-gradient(to bottom, #FFE4D8, #FFFFFF)',
                      }}
                    >
                      <div className="flex flex-col items-center text-center h-full">
                        <div className="relative mb-3">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                            <AvatarFallback className="bg-[#b5b7c0] text-white">{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 bg-[#FF8B00] rounded-full p-1">
                            <Award className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <h3 className="font-bold text-[#1d2933] dark:text-white text-sm mb-1">{student.name}</h3>
                        <div className="w-[80px] h-[28px] bg-[#FFEDD4] dark:bg-[#FF8B00]/20 rounded-[16px] px-[12px] py-[4px] flex items-center justify-center gap-1 mb-6">
                          <span className="text-sm text-[#FF8B00] font-medium">
                            {student.rank}<sup>{student.rankSuffix}</sup> Rank
                          </span>
                        </div>
                        
                        <div className="w-full space-y-3 text-xs mt-auto">
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <Checks size={16} color="#5b6480" weight="regular" />
                              Overall Score
                            </span>
                            <div className="flex items-center gap-0.5">
                              <span className="font-bold text-[#1d2933] dark:text-white text-base">{student.overallScore}</span>
                              <span className="font-medium text-[#5B6480] dark:text-gray-400 text-xs">/{student.maxScore}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <Atom size={16} color="#009966" weight="regular" />
                              Phy Score
                            </span>
                            <span className="font-semibold text-[#1d2933] dark:text-white">{student.physicsScore}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <Flask size={16} color="#F54A00" weight="regular" />
                              Chem Score
                            </span>
                            <span className="font-semibold text-[#1d2933] dark:text-white">{student.chemScore}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <MathOperations size={16} color="#155dfc" weight="regular" />
                              Maths Score
                            </span>
                            <span className="font-semibold text-[#1d2933] dark:text-white">{student.mathsScore}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <Target size={16} color="#e60076" weight="regular" />
                              Accuracy
                            </span>
                            <span className="font-semibold text-[#1d2933] dark:text-white">{student.accuracy}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : student.rank === 8 ? (
                // Custom 4th card (You)
                <div className="relative w-[264px] h-[392px]">
                  <div 
                    className="absolute inset-0 rounded-t-3xl p-[2px]"
                    style={{
                      background: isDarkMode
                        ? 'linear-gradient(180deg, #29343D 0%, #1B2126 100%)'
                        : 'linear-gradient(to bottom, rgba(234, 243, 250, 1), rgba(255, 255, 255, 1))',
                    }}
                  >
                    <div 
                      className={`relative h-full rounded-t-3xl p-6 ${isDarkMode ? 'bg-[#1B2126]' : 'bg-white'}`}
                    >
                      <div className="flex flex-col items-center text-center h-full">
                        <div className="relative mb-3">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                            <AvatarFallback className="bg-[#b5b7c0] text-white">{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                        <h3 className="font-bold text-[#1d2933] dark:text-white text-sm mb-1">{student.name} (You)</h3>
                        <div className="h-[28px] bg-[#F5F9FE] dark:bg-[#5b6480]/20 rounded-[16px] px-[12px] py-[4px] flex items-center justify-center gap-1 mb-6">
                          <span className="text-sm text-[#5b6480] dark:text-gray-400 font-medium">
                            {student.rank}<sup>{student.rankSuffix}</sup> Rank
                          </span>
                        </div>
                        
                        <div className="w-full space-y-3 text-xs mt-auto">
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <Checks size={16} color="#5b6480" weight="regular" />
                              Overall Score
                            </span>
                            <div className="flex items-center gap-0.5">
                              <span className="font-bold text-[#1d2933] dark:text-gray-100 text-base">{student.overallScore}</span>
                              <span className="font-medium text-[#5B6480] dark:text-gray-400 text-xs">/{student.maxScore}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <Atom size={16} color="#009966" weight="regular" />
                              Phy Score
                            </span>
                            <span className="font-semibold text-[#1d2933] dark:text-gray-100">{student.physicsScore}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <Flask size={16} color="#F54A00" weight="regular" />
                              Chem Score
                            </span>
                            <span className="font-semibold text-[#1d2933] dark:text-gray-100">{student.chemScore}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <MathOperations size={16} color="#155dfc" weight="regular" />
                              Maths Score
                            </span>
                            <span className="font-semibold text-[#1d2933] dark:text-gray-100">{student.mathsScore}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#5b6480] dark:text-gray-400 flex items-center gap-1">
                              <Target size={16} color="#e60076" weight="regular" />
                              Accuracy
                            </span>
                            <span className="font-semibold text-[#1d2933] dark:text-gray-100">{student.accuracy}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Regular cards for other students
                <Card className={`${student.bgColor} ${student.borderColor} border-2 p-4`}>
                  <CardContent className="p-0">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-3">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                          <AvatarFallback className="bg-[#b5b7c0] text-white">{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {student.rank <= 3 && (
                          <div className="absolute -bottom-1 -right-1 bg-[#ffac33] rounded-full p-1">
                            {student.rank === 1 && <Trophy className="h-3 w-3 text-white" />}
                            {student.rank === 2 && <Medal className="h-3 w-3 text-white" />}
                          </div>
                        )}
                      </div>

                      <h3 className="font-semibold text-[#1d2933] mb-1">{student.name}</h3>
                      <div className="text-sm text-[#5b6480] mb-3">
                        {student.rank}
                        <sup>{student.rankSuffix}</sup> Rank
                      </div>

                      <div className="w-full space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[#5b6480] flex items-center gap-1">
                            <Checks size={16} color="#5b6480" weight="regular" />
                            Overall Score
                          </span>
                          <span className="font-semibold text-[#1d2933]">
                            {student.overallScore}
                            <span className="text-[#5b6480]">/{student.maxScore}</span>
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-[#5b6480] flex items-center gap-1">
                            <Atom size={16} color="#009966" weight="regular" />
                            Phy Score
                          </span>
                          <span className="font-semibold text-[#1d2933]">{student.physicsScore}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-[#5b6480] flex items-center gap-1">
                            <Flask size={16} color="#F54A00" weight="regular" />
                            Chem Score
                          </span>
                          <span className="font-semibold text-[#1d2933]">{student.chemScore}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-[#5b6480] flex items-center gap-1">
                            <MathOperations size={16} color="#155dfc" weight="regular" />
                            Maths Score
                          </span>
                          <span className="font-semibold text-[#1d2933]">{student.mathsScore}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-[#5b6480] flex items-center gap-1">
                            <Target size={16} color="#e60076" weight="regular" />
                            Accuracy
                          </span>
                          <span className="font-semibold text-[#1d2933]">{student.accuracy}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))) : (
            // Loading state for cards on other pages
            <div className="col-span-4 flex justify-center items-center h-[392px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#432dd7]"></div>
            </div>
          )
        }
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-[#b5b7c0] dark:border-gray-700 overflow-hidden relative transition-colors">
          {/* Scrollable Table Area */}
          <div 
            className="overflow-x-auto overflow-y-auto scrollbar-hide"
            style={{ height: '480px' }}
            onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
          >
            <table className="w-full min-w-[800px]">
              <thead className="bg-[#f5f9fe] dark:bg-gray-700 border-b border-[#b5b7c0] dark:border-gray-600 sticky top-0 z-5">
                <tr>
                  <th 
                    className="text-left p-4 text-sm font-medium text-[#5b6480] dark:text-gray-400 cursor-pointer hover:text-[#432dd7] dark:hover:text-[#6b46ff] transition-colors"
                    onClick={() => {
                      if (sortBy === 'rank') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy('rank')
                        setSortOrder('asc')
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Rank
                      <ChevronDown className={`h-3 w-3 transition-transform ${sortBy === 'rank' ? (sortOrder === 'desc' ? 'rotate-180' : '') : 'opacity-30'} ${sortBy === 'rank' ? 'text-[#432dd7]' : ''}`} />
                    </div>
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-[#5b6480] dark:text-gray-400">Student Name</th>
                  <th 
                    className="text-left p-4 text-sm font-medium text-[#5b6480] dark:text-gray-400 cursor-pointer hover:text-[#432dd7] dark:hover:text-[#6b46ff] transition-colors"
                    onClick={() => {
                      if (sortBy === 'score') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy('score')
                        setSortOrder('desc')
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Overall Score
                      <ChevronDown className={`h-3 w-3 transition-transform ${sortBy === 'score' ? (sortOrder === 'desc' ? 'rotate-180' : '') : 'opacity-30'} ${sortBy === 'score' ? 'text-[#432dd7]' : ''}`} />
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 text-sm font-medium text-[#5b6480] dark:text-gray-400 cursor-pointer hover:text-[#432dd7] dark:hover:text-[#6b46ff] transition-colors"
                    onClick={() => {
                      if (sortBy === 'physics') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy('physics')
                        setSortOrder('desc')
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Phy
                      <ChevronDown className={`h-3 w-3 transition-transform ${sortBy === 'physics' ? (sortOrder === 'desc' ? 'rotate-180' : '') : 'opacity-30'} ${sortBy === 'physics' ? 'text-[#432dd7]' : ''}`} />
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 text-sm font-medium text-[#5b6480] dark:text-gray-400 cursor-pointer hover:text-[#432dd7] dark:hover:text-[#6b46ff] transition-colors"
                    onClick={() => {
                      if (sortBy === 'chemistry') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy('chemistry')
                        setSortOrder('desc')
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Chem
                      <ChevronDown className={`h-3 w-3 transition-transform ${sortBy === 'chemistry' ? (sortOrder === 'desc' ? 'rotate-180' : '') : 'opacity-30'} ${sortBy === 'chemistry' ? 'text-[#432dd7]' : ''}`} />
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 text-sm font-medium text-[#5b6480] dark:text-gray-400 cursor-pointer hover:text-[#432dd7] dark:hover:text-[#6b46ff] transition-colors"
                    onClick={() => {
                      if (sortBy === 'maths') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy('maths')
                        setSortOrder('desc')
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Maths
                      <ChevronDown className={`h-3 w-3 transition-transform ${sortBy === 'maths' ? (sortOrder === 'desc' ? 'rotate-180' : '') : 'opacity-30'} ${sortBy === 'maths' ? 'text-[#432dd7]' : ''}`} />
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 text-sm font-medium text-[#5b6480] dark:text-gray-400 cursor-pointer hover:text-[#432dd7] dark:hover:text-[#6b46ff] transition-colors"
                    onClick={() => {
                      if (sortBy === 'accuracy') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy('accuracy')
                        setSortOrder('desc')
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Accuracy
                      <ChevronDown className={`h-3 w-3 transition-transform ${sortBy === 'accuracy' ? (sortOrder === 'desc' ? 'rotate-180' : '') : 'opacity-30'} ${sortBy === 'accuracy' ? 'text-[#432dd7]' : ''}`} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableStudents
                  .filter((student) => {
                    // On desktop, skip ranks 1-3 as they're in cards (only on page 1)
                    // On mobile, show all ranks
                    if (!isMobile && currentPage === 1) {
                      return student.rank > 3
                    }
                    return true
                  })
                  .map((student, index) => (
                  <tr 
                    key={`table-row-${student.rank}-${index}`} 
                    className={`border-b border-[#f5f9fe] dark:border-gray-700 hover:bg-[#f5f9fe]/50 dark:hover:bg-gray-700/50 ${
                      student.id === currentUser?.id ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="p-4">
                      {student.rank <= 3 && isMobile ? (
                        // Special styling for ranks 1-3 on mobile
                        <div 
                          className="w-7 h-7 min-w-[28px] rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{
                            background: student.rank === 1 
                              ? 'linear-gradient(135deg, rgba(245, 74, 0, 1), rgba(255, 199, 33, 1))'
                              : student.rank === 2
                              ? 'linear-gradient(135deg, rgba(169, 181, 195, 1), rgba(99, 111, 125, 1))'
                              : 'linear-gradient(135deg, rgba(169, 52, 16, 1), rgba(203, 62, 19, 1))'
                          }}
                        >
                          {student.rank}
                        </div>
                      ) : (
                        // Regular rank circle
                        <div className="w-7 h-7 min-w-[28px] rounded-full border border-[#D2DFEB] dark:border-gray-600 bg-[#F5F9FE] dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-sm text-[#1d2933] dark:text-gray-100 font-medium">{student.rank}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                          <AvatarFallback className="bg-[#b5b7c0] text-white text-xs">
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-bold text-[#1d2933] dark:text-gray-100">{student.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="h-8 px-3 bg-[#F5F9FE] dark:bg-gray-700 rounded-full inline-flex items-center gap-0.5">
                        <span className="font-bold text-[#1d2933] dark:text-gray-100 text-base">{student.overallScore}</span>
                        <span className="font-medium text-[#5B6480] dark:text-gray-400 text-xs">/{student.maxScore}</span>
                      </div>
                    </td>
                    {student.subjects.map((subject, idx) => (
                      <td key={idx} className="p-4 text-sm text-[#1d2933] dark:text-gray-100">{subject.score}</td>
                    ))}
                    <td className="p-4 text-sm text-[#1d2933] dark:text-gray-100">{student.accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Showing current page info */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-[#5b6480] dark:text-gray-400">
            {!isMobile && currentPage === 1 
              ? `Showing ranks 4-10`
              : `Showing ranks ${((currentPage - 1) * 10) + 1}-${currentPage * 10}`
            }
          </div>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[#5b6480] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              size="sm"
              className={page === currentPage ? "bg-[#432dd7] text-white hover:bg-[#432dd7]/90 dark:bg-[#432dd7] dark:hover:bg-[#432dd7]/80" : "text-[#5b6480] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}
              variant={page === currentPage ? "default" : "ghost"}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          
          {totalPages > 5 && (
            <>
              <span className="text-[#5b6480] dark:text-gray-400 px-2">...</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#5b6480] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[#5b6480] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>

        {/* Current User Row */}
        {currentUser && (
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg border border-[#b5b7c0] dark:border-gray-700 overflow-hidden">
            <div 
              className="bg-[#dbeafe] dark:bg-gray-700 overflow-x-auto scrollbar-hide"
              style={{ transform: `translateX(-${scrollLeft}px)` }}
            >
              <table className="w-full min-w-[800px]">
                <tbody>
                  <tr>
                    <td className="p-4">
                      <div className="w-7 h-7 min-w-[28px] rounded-full border border-[#155dfc] dark:border-gray-500 bg-[#dbeafe] dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-sm text-[#1d2933] dark:text-gray-100 font-medium">{currentUser.rank}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                          <AvatarFallback className="bg-[#155dfc] text-white text-xs">
                            {currentUser.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-bold text-[#1d2933] dark:text-gray-100">{currentUser.name} (You)</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="h-8 px-3 bg-[#155dfc]/20 dark:bg-gray-600 rounded-full inline-flex items-center gap-0.5">
                        <span className="font-bold text-[#1d2933] dark:text-gray-100 text-base">{currentUser.overallScore}</span>
                        <span className="font-medium text-[#5B6480] dark:text-gray-400 text-xs">/{currentUser.maxScore}</span>
                      </div>
                    </td>
                    {currentUser.subjects.map((subject, idx) => (
                      <td key={idx} className="p-4 text-sm text-[#1d2933] dark:text-gray-100 font-semibold">{subject.score}</td>
                    ))}
                    <td className="p-4 text-sm text-[#1d2933] dark:text-gray-100 font-semibold">{currentUser.accuracy}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
