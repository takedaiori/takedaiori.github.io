'use strict'
// Never print values. Prevent accidental deployment of the upstream demo database.
if (!process.env.NOTION_PAGE_ID?.trim()) throw Error('NOTION_PAGE_ID must be configured before a server deployment')
if (process.env.EXPORT === 'true') throw Error('The Netlify server configuration requires EXPORT to be unset')
const canonical = process.env.NEXT_PUBLIC_LINK
const url = canonical ? new URL(canonical) : null
if (!url || url.protocol !== 'https:' || url.username || url.password) throw Error('Configure NEXT_PUBLIC_LINK to the HTTPS URL of this deployment')
console.log('Server deployment environment prerequisites verified (values hidden)')
