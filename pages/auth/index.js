/** Legacy OAuth exchange must never serialize tokens into page props or URLs. */
export default function NotionAuthDisabled() {
  return <p>Notion OAuth is disabled.</p>
}
