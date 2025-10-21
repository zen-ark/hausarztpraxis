export function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Guten Morgen'
  if (hour >= 12 && hour < 18) return 'Guten Tag'
  return 'Guten Abend'
}


