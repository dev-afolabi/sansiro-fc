import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const normaliseMatch = (m) => ({
  ...m,
  asideSize: m.aside_size,
  backmanA: m.backman_a,
  backmanB: m.backman_b,
  teamA: m.team_a ?? [],
  teamB: m.team_b ?? [],
  scoreA: m.score_a,
  scoreB: m.score_b,
  goalScorers: m.goal_scorers ?? [],
  substitutesA: m.substitutes_a ?? [],
  substitutesB: m.substitutes_b ?? [],
})

// Gets the current authenticated user from Supabase directly.
// useAuth is a React context hook — it cannot be called outside a component.
const getUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}

export const useStore = create((set, get) => ({
  players: [],
  matchDays: [],
  activeMatchId: null,
  loading: false,

  initializeData: async () => {
    const user = await getUser()
    if (!user) return

    set({ loading: true })
    try {
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (playersError) throw playersError

      const { data: matchDays, error: matchDaysError } = await supabase
        .from('match_days')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (matchDaysError) throw matchDaysError

      const activeMatch = matchDays.find(m => m.status !== 'completed')

      set({
        players: players || [],
        matchDays: (matchDays || []).map(normaliseMatch),
        activeMatchId: activeMatch?.id || null,
        loading: false
      })
    } catch (error) {
      console.error('Error initializing data:', error)
      set({ loading: false })
    }
  },

  initializePublicData: async () => {
    set({ loading: true })
    try {
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('archived', false)
        .order('points', { ascending: false })

      if (playersError) throw playersError

      const { data: matchDays, error: matchDaysError } = await supabase
        .from('match_days')
        .select('*')
        .eq('status', 'completed')
        .order('date', { ascending: false })

      if (matchDaysError) throw matchDaysError

      set({
        players: players || [],
        matchDays: (matchDays || []).map(normaliseMatch),
        loading: false
      })
    } catch (error) {
      console.error('Error loading public data:', error)
      set({ loading: false })
    }
  },

  createPlayer: async (name) => {
    const user = await getUser()
    if (!user || !name.trim()) return null

    try {
      const { data, error } = await supabase
        .from('players')
        .insert({ user_id: user.id, name: name.trim() })
        .select()
        .single()

      if (error) throw error

      set(state => ({ players: [...state.players, data] }))
      return data.id
    } catch (error) {
      console.error('Error creating player:', error)
      return null
    }
  },

  deletePlayer: async (id) => {
    const user = await getUser()
    if (!user) return

    try {
      const { data: matchDays } = await supabase
        .from('match_days')
        .select('id')
        .eq('user_id', user.id)
        .or(`backman_a.eq.${id},backman_b.eq.${id}`)
        .contains('players', [id])

      const hasHistory = matchDays && matchDays.length > 0

      if (hasHistory) {
        const { error } = await supabase
          .from('players')
          .update({ archived: true })
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) throw error

        set(state => ({
          players: state.players.map(p => p.id === id ? { ...p, archived: true } : p)
        }))
      } else {
        const { error } = await supabase
          .from('players')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) throw error

        set(state => ({ players: state.players.filter(p => p.id !== id) }))
      }
    } catch (error) {
      console.error('Error deleting player:', error)
    }
  },

  createMatchDay: async (asideSize = 8) => {
    const user = await getUser()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('match_days')
        .insert({ user_id: user.id, aside_size: asideSize })
        .select()
        .single()

      if (error) throw error

      set(state => ({
        matchDays: [normaliseMatch(data), ...state.matchDays],
        activeMatchId: data.id
      }))

      return data.id
    } catch (error) {
      console.error('Error creating match day:', error)
    }
  },

  updateMatchDate: async (matchId, date) => {
    const user = await getUser()
    if (!user) return

    try {
      const { error } = await supabase
        .from('match_days')
        .update({ date })
        .eq('id', matchId)
        .eq('user_id', user.id)

      if (error) throw error

      set(state => ({
        matchDays: state.matchDays.map(m =>
          m.id === matchId ? { ...m, date } : m
        )
      }))
    } catch (error) {
      console.error('Error updating match date:', error)
    }
  },

  setBackman: async (matchId, team, playerId) => {
    const user = await getUser()
    if (!user) return

    try {
      const updateData = team === 'A' ? { backman_a: playerId } : { backman_b: playerId }

      const { data, error } = await supabase
        .from('match_days')
        .update(updateData)
        .eq('id', matchId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      const players = new Set(data.players)
      if (data.backman_a) players.add(data.backman_a)
      if (data.backman_b) players.add(data.backman_b)

      const { error: updateError } = await supabase
        .from('match_days')
        .update({ players: [...players] })
        .eq('id', matchId)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      set(state => ({
        matchDays: state.matchDays.map(m =>
          m.id === matchId ? normaliseMatch({ ...data, players: [...players] }) : m
        )
      }))
    } catch (error) {
      console.error('Error setting backman:', error)
    }
  },

  addPlayerToTeamsheet: async (matchId, playerId) => {
    const user = await getUser()
    if (!user) return

    try {
      const match = get().matchDays.find(m => m.id === matchId)
      if (!match || match.players.includes(playerId)) return

      const needed = match.aside_size * 2
      if (match.players.length >= needed) return

      const players = [...match.players, playerId]

      const { error } = await supabase
        .from('match_days')
        .update({ players, status: 'teamsheet' })
        .eq('id', matchId)
        .eq('user_id', user.id)

      if (error) throw error

      set(state => ({
        matchDays: state.matchDays.map(m =>
          m.id === matchId ? { ...m, players, status: 'teamsheet' } : m
        )
      }))
    } catch (error) {
      console.error('Error adding player to teamsheet:', error)
    }
  },

  removePlayerFromTeamsheet: async (matchId, playerId) => {
    const user = await getUser()
    if (!user) return

    try {
      const match = get().matchDays.find(m => m.id === matchId)
      if (!match) return

      if (playerId === match.backman_a || playerId === match.backman_b) return

      const players = match.players.filter(id => id !== playerId)

      const { error } = await supabase
        .from('match_days')
        .update({ players })
        .eq('id', matchId)
        .eq('user_id', user.id)

      if (error) throw error

      set(state => ({
        matchDays: state.matchDays.map(m =>
          m.id === matchId ? { ...m, players } : m
        )
      }))
    } catch (error) {
      console.error('Error removing player from teamsheet:', error)
    }
  },

  setTeamsManually: async (matchId, teamA, teamB, substitutesA, substitutesB) => {
    const user = await getUser()
    if (!user) return

    try {
      const { error } = await supabase
        .from('match_days')
        .update({
          team_a: teamA,
          team_b: teamB,
          substitutes_a: substitutesA,
          substitutes_b: substitutesB,
          status: 'teams'
        })
        .eq('id', matchId)
        .eq('user_id', user.id)

      if (error) throw error

      set(state => ({
        matchDays: state.matchDays.map(m =>
          m.id === matchId
            ? normaliseMatch({
                ...m,
                team_a: teamA,
                team_b: teamB,
                substitutes_a: substitutesA,
                substitutes_b: substitutesB,
                status: 'teams'
              })
            : m
        )
      }))
    } catch (error) {
      console.error('Error setting teams manually:', error)
    }
  },

  randomizeTeams: async (matchId) => {
    const user = await getUser()
    if (!user) return

    try {
      const match = get().matchDays.find(m => m.id === matchId)
      if (!match) return

      const availablePlayers = match.players.filter(id =>
        id !== match.backman_a && id !== match.backman_b
      )

      for (let i = availablePlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availablePlayers[i], availablePlayers[j]] = [availablePlayers[j], availablePlayers[i]];
      }

      const half = Math.floor(availablePlayers.length / 2)
      const teamA = match.backman_a
        ? [match.backman_a, ...availablePlayers.slice(0, half)]
        : availablePlayers.slice(0, half)
      const teamB = match.backman_b
        ? [match.backman_b, ...availablePlayers.slice(half)]
        : availablePlayers.slice(half)

      const { error } = await supabase
        .from('match_days')
        .update({ team_a: teamA, team_b: teamB, status: 'teams' })
        .eq('id', matchId)
        .eq('user_id', user.id)

      if (error) throw error

      set(state => ({
        matchDays: state.matchDays.map(m =>
          m.id === matchId
            ? normaliseMatch({ ...m, team_a: teamA, team_b: teamB, status: 'teams' })
            : m
        )
      }))
    } catch (error) {
      console.error('Error randomizing teams:', error)
    }
  },

  addSubstitute: async (matchId, team, playerId) => {
    const user = await getUser()
    if (!user) return

    try {
      const match = get().matchDays.find(m => m.id === matchId)
      if (!match) return

      const field = team === 'A' ? 'substitutes_a' : 'substitutes_b'
      const localField = team === 'A' ? 'substitutesA' : 'substitutesB'
      const current = match[localField] || match[field] || []

      if (current.includes(playerId)) return

      const updated = [...current, playerId]

      const { error } = await supabase
        .from('match_days')
        .update({ [field]: updated })
        .eq('id', matchId)
        .eq('user_id', user.id)

      if (error) throw error

      set(state => ({
        matchDays: state.matchDays.map(m =>
          m.id === matchId
            ? { ...m, [field]: updated, [localField]: updated }
            : m
        )
      }))
    } catch (error) {
      console.error('Error adding substitute:', error)
    }
  },

  removeSubstitute: async (matchId, team, playerId) => {
    const user = await getUser()
    if (!user) return

    try {
      const match = get().matchDays.find(m => m.id === matchId)
      if (!match) return

      const field = team === 'A' ? 'substitutes_a' : 'substitutes_b'
      const localField = team === 'A' ? 'substitutesA' : 'substitutesB'
      const current = match[localField] || match[field] || []
      const updated = current.filter(id => id !== playerId)

      const { error } = await supabase
        .from('match_days')
        .update({ [field]: updated })
        .eq('id', matchId)
        .eq('user_id', user.id)

      if (error) throw error

      set(state => ({
        matchDays: state.matchDays.map(m =>
          m.id === matchId
            ? { ...m, [field]: updated, [localField]: updated }
            : m
        )
      }))
    } catch (error) {
      console.error('Error removing substitute:', error)
    }
  },

  submitScore: async (matchId, scoreA, scoreB, goalScorers, assists) => {
    const user = await getUser()
    if (!user) return

    try {
      const match = get().matchDays.find(m => m.id === matchId)
      if (!match) return

      const teamA = match.team_a || []
      const teamB = match.team_b || []
      const subsA = match.substitutes_a || match.substitutesA || []
      const subsB = match.substitutes_b || match.substitutesB || []

      const allPlayers = [...teamA, ...teamB, ...subsA, ...subsB]

      const updates = {}
      allPlayers.forEach(playerId => {
        const isTeamA = teamA.includes(playerId) || subsA.includes(playerId)
        updates[playerId] = {
          totalGoals: 0,
          totalConceded: isTeamA ? Number(scoreB) : Number(scoreA),
          totalAssists: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          points: 0,
          matchesPlayed: 1
        }
      })

      if (scoreA > scoreB) {
        ;[...teamA, ...subsA].forEach(id => {
          if (updates[id]) { updates[id].wins = 1; updates[id].points = 3 }
        })
        ;[...teamB, ...subsB].forEach(id => {
          if (updates[id]) { updates[id].losses = 1 }
        })
      } else if (scoreB > scoreA) {
        ;[...teamB, ...subsB].forEach(id => {
          if (updates[id]) { updates[id].wins = 1; updates[id].points = 3 }
        })
        ;[...teamA, ...subsA].forEach(id => {
          if (updates[id]) { updates[id].losses = 1 }
        })
      } else {
        allPlayers.forEach(id => {
          if (updates[id]) { updates[id].draws = 1; updates[id].points = 1 }
        })
      }

      goalScorers.forEach(({ playerId, count }) => {
        if (updates[playerId]) updates[playerId].totalGoals += count
      })

      assists?.forEach(({ playerId, count }) => {
        if (updates[playerId]) updates[playerId].totalAssists += count
      })

      const { error: matchError } = await supabase
        .from('match_days')
        .update({
          score_a: Number(scoreA),
          score_b: Number(scoreB),
          goal_scorers: goalScorers,
          assists: assists || [],
          status: 'completed'
        })
        .eq('id', matchId)
        .eq('user_id', user.id)

      if (matchError) throw matchError

      const currentPlayers = get().players
      for (const [playerId, stats] of Object.entries(updates)) {
        const current = currentPlayers.find(p => p.id === playerId)
        if (!current) continue

        const { error: playerError } = await supabase
          .from('players')
          .update({
            total_goals:    current.total_goals    + stats.totalGoals,
            total_conceded: current.total_conceded + stats.totalConceded,
            total_assists:  current.total_assists  + stats.totalAssists,
            wins:           current.wins           + stats.wins,
            draws:          current.draws          + stats.draws,
            losses:         current.losses         + stats.losses,
            points:         current.points         + stats.points,
            matches_played: current.matches_played + stats.matchesPlayed,
          })
          .eq('id', playerId)
          .eq('user_id', user.id)

        if (playerError) throw playerError
      }

      set(state => ({
        players: state.players.map(p => {
          const update = updates[p.id]
          if (!update) return p
          return {
            ...p,
            total_goals:    p.total_goals    + update.totalGoals,
            total_conceded: p.total_conceded + update.totalConceded,
            total_assists:  p.total_assists  + update.totalAssists,
            wins:           p.wins           + update.wins,
            draws:          p.draws          + update.draws,
            losses:         p.losses         + update.losses,
            points:         p.points         + update.points,
            matches_played: p.matches_played + update.matchesPlayed
          }
        }),
        matchDays: state.matchDays.map(m =>
          m.id === matchId
            ? normaliseMatch({
                ...m,
                score_a: Number(scoreA),
                score_b: Number(scoreB),
                goal_scorers: goalScorers,
                assists: assists || [],
                status: 'completed'
              })
            : m
        ),
        activeMatchId: state.activeMatchId === matchId ? null : state.activeMatchId
      }))
    } catch (error) {
      console.error('Error submitting score:', error)
    }
  },

  updateAsideSize: async (matchId, size) => {
    const user = await getUser()
    if (!user) return

    try {
      const { error } = await supabase
        .from('match_days')
        .update({ aside_size: size })
        .eq('id', matchId)
        .eq('user_id', user.id)

      if (error) throw error

      set(state => ({
        matchDays: state.matchDays.map(m =>
          m.id === matchId ? { ...m, aside_size: size, asideSize: size } : m
        )
      }))
    } catch (error) {
      console.error('Error updating aside size:', error)
    }
  }
}))
