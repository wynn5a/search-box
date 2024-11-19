export function formatJsonString(results: unknown): string {
  if (!results) {
    return JSON.stringify({
      message: "No data available. Try running a query to see results here.",
      tip: "You can use the query editor above to search your data."
    }, null, 2)
  }

  try {
    return JSON.stringify(results, null, 2)
  } catch (error) {
    return JSON.stringify({
      error: "Unable to format JSON data",
      message: error instanceof Error ? error.message : "Unknown error"
    }, null, 2)
  }
}
