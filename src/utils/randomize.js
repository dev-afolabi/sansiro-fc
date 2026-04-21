const shuffle = (list) => {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const randomizeMatchTeams = (players, backmanA, backmanB) => {
  const pool = players.filter((id) => id !== backmanA && id !== backmanB);
  const shuffled = shuffle(pool);
  const half = Math.floor(shuffled.length / 2);
  const teamA = backmanA ? [backmanA, ...shuffled.slice(0, half)] : shuffled.slice(0, half);
  const teamB = backmanB ? [backmanB, ...shuffled.slice(half)] : shuffled.slice(half);
  return { teamA, teamB };
};
