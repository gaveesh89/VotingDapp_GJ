// Simple voting service using mock data for demonstration
import { getApiContext } from './get-api-context.js'

const PROGRAM_ID = 'ErWpLzQeDSoB1nuTs2x1d2yHA2AsBvZHg4nNkAusyNK8'

export async function createPoll(
  pollId: number,
  question: string,
  description: string,
  startTime: number,
  endTime: number
) {
  try {
    const context = await getApiContext()
    context.log.info(`Creating poll ${pollId}: ${question}`)
    
    return { 
      success: true, 
      transaction: 'mock_transaction_' + Date.now(),
      message: `Poll "${question}" created with ID ${pollId}`
    }
  } catch (error) {
    const err = error as Error
    return { success: false, error: err.message || 'Unknown error' }
  }
}

export async function addCandidate(pollId: number, name: string, party: string) {
  try {
    const context = await getApiContext()
    context.log.info(`Adding candidate ${name} (${party}) to poll ${pollId}`)
    
    return { 
      success: true, 
      transaction: 'mock_transaction_' + Date.now(),
      message: `Candidate "${name}" from ${party} added to poll ${pollId}`
    }
  } catch (error) {
    const err = error as Error
    return { success: false, error: err.message || 'Unknown error' }
  }
}

export async function vote(pollId: number, candidateName: string) {
  try {
    const context = await getApiContext()
    context.log.info(`Casting vote for ${candidateName} in poll ${pollId}`)
    
    return { 
      success: true, 
      transaction: 'mock_transaction_' + Date.now(),
      message: `Vote cast for "${candidateName}" in poll ${pollId}`
    }
  } catch (error) {
    const err = error as Error
    return { success: false, error: err.message || 'Unknown error' }
  }
}

export async function getPollResults(pollId: number) {
  try {
    const context = await getApiContext()
    context.log.info(`Fetching results for poll ${pollId}`)
    
    const mockPoll = {
      id: pollId,
      question: "Who should be the next president?",
      description: "Presidential election 2024",
      startTime: Date.now() - 3600000,
      endTime: Date.now() + 86400000,
    }
    
    const mockCandidates = [
      { name: "Alice Johnson", party: "Democratic Party", votes: 42 },
      { name: "Bob Smith", party: "Republican Party", votes: 38 },
      { name: "Charlie Brown", party: "Independent", votes: 15 },
    ]
    
    return {
      success: true,
      poll: mockPoll,
      candidates: mockCandidates,
    }
  } catch (error) {
    const err = error as Error
    return { success: false, error: err.message || 'Unknown error' }
  }
}
