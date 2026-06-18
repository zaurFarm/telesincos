export async function getSummary() {
  const res = await fetch('/api/analytics/summary', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
  });
  return res.json();
}

export async function getTimeseries() {
  const res = await fetch('/api/analytics/timeseries', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
  });
  return res.json();
}

export async function getLeadsPipeline() {
  const res = await fetch('/api/leads/priority', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
  });
  return res.json();
}

export async function getRevenueAttribution() {
  const res = await fetch('/api/revenue/attribution', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
  });
  return res.json();
}

export async function getFollowups() {
  const res = await fetch('/api/followups', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
  });
  return res.json();
}

export async function setAIControl(data: any) {
  const res = await fetch('/api/ai/control', {
      method: 'POST',
      headers: { 
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
  });
  return res.json();
}
