import { assertEquals } from "@std/assert"
import {
  type createIssueRelations,
  getIssueIdentifier,
} from "../../src/utils/linear.ts"

Deno.test("getIssueId - handles full issue identifiers", async () => {
  const result = await getIssueIdentifier("ABC-123")
  assertEquals(result, "ABC-123")
})

Deno.test("getIssueId - handles integer-only IDs with team prefix", async () => {
  Deno.env.set("LINEAR_TEAM_ID", "CLI")

  const result = await getIssueIdentifier("123")
  assertEquals(result, "CLI-123")

  Deno.env.delete("LINEAR_TEAM_ID")
})

Deno.test("getIssueId - rejects invalid integer patterns", async () => {
  Deno.env.set("LINEAR_TEAM_ID", "TEST")

  const result = await getIssueIdentifier("0123") // Leading zero should be rejected
  assertEquals(result, undefined)

  Deno.env.delete("LINEAR_TEAM_ID")
})

Deno.test("getIssueId - rejects zero", async () => {
  Deno.env.set("LINEAR_TEAM_ID", "TEST")

  const result = await getIssueIdentifier("0")
  assertEquals(result, undefined)

  Deno.env.delete("LINEAR_TEAM_ID")
})

Deno.test("getIssueId - uses defaultTeamKey for numeric IDs", async () => {
  // Test with no configured team, but defaultTeamKey provided
  const result = await getIssueIdentifier("456", "RAILS")
  assertEquals(result, "RAILS-456")
})

Deno.test("getIssueId - defaultTeamKey overrides configured team", async () => {
  Deno.env.set("LINEAR_TEAM_ID", "CLI")

  // defaultTeamKey should take precedence
  const result = await getIssueIdentifier("789", "ENG")
  assertEquals(result, "ENG-789")

  Deno.env.delete("LINEAR_TEAM_ID")
})

Deno.test("getIssueId - defaultTeamKey doesn't affect full identifiers", async () => {
  // Full identifiers should be returned as-is, ignoring defaultTeamKey
  const result = await getIssueIdentifier("ABC-123", "OTHER")
  assertEquals(result, "ABC-123")
})
