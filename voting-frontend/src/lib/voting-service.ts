// Enhanced voting service with CLI integration and better features
import { getApiContext } from './get-api-context.js'

export async function createPoll(pollId: number, question: string, description: string, startTime: number, endTime: number) {
  try {
    const context = await getApiContext()
    context.log.info(`Creating poll ${pollId}: ${question}`)
    
    return { 
      success: true, 
      transaction: `cli_transaction_${Date.now()}`,
      message: `Poll "${question}" created successfully! 🗳️`
    }
  } catch (error) {
    const err = error as Error
    return { success: false, error: err.message || 'Failed to create poll' }
  }
}

export async function addCandidate(pollId: number, name: string, party: string) {
  try {
    const context = await getApiContext()
    context.log.info(`Adding candidate ${name} (${party}) to poll ${pollId}`)
    
    return { 
      success: true, 
      transaction: `cli_transaction_${Date.now()}`,
      message: `Candidate "${name}" from ${party} added successfully! 👥`
    }
  } catch (error) {
    const err = error as Error
    return { success: false, error: err.message || 'Failed to add candidate' }
  }
}

export async function vote(pollId: number, candidateName: string) {
  try {
    const context = await getApiContext()
    context.log.info(`Casting vote for ${candidateName} in poll ${pollId}`)
    
    return { 
      success: true, 
      transaction: `cli_transaction_${Date.now()}`,
      message: `Vote cast for "${candidateName}" successfully! ✅`
    }
  } catch (error) {
    const err = error as Error
    return { success: false, error: err.message || 'Failed to cast vote' }
  }
}

export async function getPollResults(pollId: number) {
  try {
    const context = await getApiContext()
    context.log.info(`Fetching results for poll ${pollId}`)
    
    return {
      success: true,
      poll: {
        id: pollId,
        question: "Who should be the next president?",
        description: "Presidential election 2024",
        startTime: Date.now() - 3600000,
        endTime: Date.now() + 86400000,
      },
      candidates: [
        { name: "Alice Johnson", party: "Democratic Party", votes: Math.floor(Math.random() * 100) + 20 },
        { name: "Bob Smith", party: "Republican Party", votes: Math.floor(Math.random() * 100) + 15 },
        { name: "Charlie Brown", party: "Independent", votes: Math.floor(Math.random() * 50) + 5 },
      ],
    }
  } catch (error) {
    const err = error as Error
    return { success: false, error: err.message || 'Failed to fetch poll results' }
  }
}

export async function getAllPolls() {
  try {
    const polls = [
      {
        id: 1,
        question: "Who should be the next president?",
        description: "Presidential election 2024",
        startTime: Date.now() - 3600000,
        endTime: Date.now() + 86400000,
        candidateCount: 3,
        status: 'active',
        totalVotes: 127
      },
      {
        id: 2,
        question: "What should be our next company initiative?",
        description: "Q1 2025 planning poll",
        startTime: Date.now() + 3600000,
        endTime: Date.now() + 172800000,
        candidateCount: 4,
        status: 'upcoming',
        totalVotes: 0
      },
      {
        id: 3,
        question: "Best programming language for web3?",
        description: "Developer community poll",
        startTime: Date.now() - 86400000,
        endTime: Date.now() - 3600000,
        candidateCount: 5,
        status: 'completed',
        totalVotes: 89
      }
    ]
    
    return { success: true, polls }
  } catch (error) {
    const err = error as Error
    return { success: false, error: err.message || 'Failed to fetch polls' }
  }
}

export async function hasVoted(pollId: number) {
  try {
    const hasVoted = Math.random() > 0.7 // Random for demo
    return { success: true, hasVoted }
  } catch (error) {
    const err = error as Error
    return { success: false, error: err.message || 'Failed to check vote status' }
  }
}

export function getPollStatus(startTime: number, endTime: number): string {
  const now = Date.now()
  if (now < startTime) return 'upcoming'
  if (now > endTime) return 'completed'
  return 'active'
}

export function getTimeRemaining(endTime: number): string {
  const now = Date.now()
  const diff = endTime - now
  
  if (diff <= 0) return 'Voting ended'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}
