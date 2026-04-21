export const buildPlayerStatUpdates = (match, scoreA, scoreB, goalScorers = []) => {
  const scorerMap = goalScorers.reduce((acc, s) => {
    acc[s.playerId] = (acc[s.playerId] || 0) + Number(s.count || 0);
    return acc;
  }, {});

  const update = {};
  const draw = scoreA === scoreB;
  const teamAWon = scoreA > scoreB;

  const updatePlayer = (id, isTeamA) => {
    const win = draw ? 0 : (isTeamA ? teamAWon : !teamAWon) ? 1 : 0;
    const loss = draw ? 0 : win ? 0 : 1;
    const draws = draw ? 1 : 0;
    const conceded = isTeamA ? scoreB : scoreA;
    const goals = scorerMap[id] || 0;
    const points = win * 3 + draws;

    update[id] = {
      totalGoals: goals,
      totalConceded: conceded,
      wins: win,
      draws,
      losses: loss,
      points,
      matchesPlayed: 1,
    };
  };

  match.teamA.forEach((id) => updatePlayer(id, true));
  match.teamB.forEach((id) => updatePlayer(id, false));

  return Object.fromEntries(
    Object.entries(update).map(([id, s]) => [
      id,
      {
        totalGoals: s.totalGoals,
        totalConceded: s.totalConceded,
        wins: s.wins,
        draws: s.draws,
        losses: s.losses,
        points: s.points,
        matchesPlayed: s.matchesPlayed,
      },
    ])
  );
};
