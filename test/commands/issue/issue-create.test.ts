import { snapshotTest } from "@cliffy/testing"
import { createCommand } from "../../../src/commands/issue/issue-create.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Issue Create Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await createCommand.parse()
  },
})

// Test creating an issue with flags (happy path)
await snapshotTest({
  name: "Issue Create Command - Happy Path",
  meta: import.meta,
  colors: false,
  args: [
    "--title",
    "Fix authentication bug",
    "--description",
    "Users are experiencing login issues",
    "--assignee",
    "self",
    "--priority",
    "2",
    "--estimate",
    "3",
    "--team",
    "ENG",
    "--no-interactive",
    "--no-color",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      // Mock response for getTeamIdByKey() - converting team key to ID
      {
        queryName: "GetTeamIdByKey",
        variables: { team: "ENG" },
        response: {
          data: {
            teams: {
              nodes: [{ id: "team-eng-id" }],
            },
          },
        },
      },
      // Mock response for lookupUserId("self")
      {
        queryName: "LookupUser",
        variables: { input: "self" },
        response: {
          data: {
            users: {
              nodes: [{
                id: "user-self-123",
                email: "self@example.com",
                displayName: "Self User",
                name: "self",
              }],
            },
          },
        },
      },
      // Mock response for the create issue mutation
      {
        queryName: "CreateIssue",
        response: {
          data: {
            issueCreate: {
              success: true,
              issue: {
                id: "issue-new-456",
                identifier: "ENG-123",
                url:
                  "https://linear.app/test-team/issue/ENG-123/fix-authentication-bug",
                team: {
                  key: "ENG",
                },
              },
            },
          },
        },
      },
    ], { LINEAR_TEAM_ID: "ENG" })

    try {
      await createCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test creating an issue with case-insensitive label matching
await snapshotTest({
  name: "Issue Create Command - Case Insensitive Label Matching",
  meta: import.meta,
  colors: false,
  args: [
    "--title",
    "Test case insensitive labels",
    "--description",
    "Testing label matching",
    "--label",
    "BUG", // uppercase label that should match "bug" label
    "--team",
    "ENG",
    "--no-interactive",
    "--no-color",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      // Mock response for getTeamIdByKey() - converting team key to ID
      {
        queryName: "GetTeamIdByKey",
        variables: { team: "ENG" },
        response: {
          data: {
            teams: {
              nodes: [{ id: "team-eng-id" }],
            },
          },
        },
      },
      // Mock response for getIssueLabelIdByNameForTeam("BUG", "ENG") - case insensitive
      {
        queryName: "GetIssueLabelIdByNameForTeam",
        variables: { name: "BUG", teamKey: "ENG" },
        response: {
          data: {
            issueLabels: {
              nodes: [{
                id: "label-bug-123",
                name: "bug", // actual label is lowercase
              }],
            },
          },
        },
      },
      // Mock response for the create issue mutation
      {
        queryName: "CreateIssue",
        response: {
          data: {
            issueCreate: {
              success: true,
              issue: {
                id: "issue-new-789",
                identifier: "ENG-456",
                url:
                  "https://linear.app/test-team/issue/ENG-456/test-case-insensitive-labels",
                team: {
                  key: "ENG",
                },
              },
            },
          },
        },
      },
    ], { LINEAR_TEAM_ID: "ENG" })

    try {
      await createCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test creating an issue with blocking relationships
await snapshotTest({
  name: "Issue Create Command - With Blocking Relationships",
  meta: import.meta,
  colors: false,
  args: [
    "--title",
    "Implement authentication refactor",
    "--description",
    "Refactor authentication module for better security",
    "--team",
    "ENG",
    "--blocking",
    "ENG-100",
    "101", // numeric ID should use team key
    "--blocked-by",
    "ENG-99",
    "--no-interactive",
    "--no-color",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      // Mock response for getTeamIdByKey() - converting team key to ID
      {
        queryName: "GetTeamIdByKey",
        variables: { team: "ENG" },
        response: {
          data: {
            teams: {
              nodes: [{ id: "team-eng-id" }],
            },
          },
        },
      },
      // Mock response for getting team key (for title conversion)
      {
        queryName: "GetTeamKeys",
        response: {
          data: {
            teams: {
              nodes: [{
                id: "team-eng-id",
                key: "ENG",
              }],
            },
          },
        },
      },
      // Mock response for the create issue mutation
      {
        queryName: "CreateIssue",
        response: {
          data: {
            issueCreate: {
              success: true,
              issue: {
                id: "issue-new-200",
                identifier: "ENG-200",
                url:
                  "https://linear.app/test-team/issue/ENG-200/implement-authentication-refactor",
                title: "Implement authentication refactor",
                team: {
                  key: "ENG",
                },
              },
            },
          },
        },
      },
      // Mock for getting issue ID of ENG-200 (self)
      {
        queryName: "GetIssueId",
        variables: { id: "ENG-200" },
        response: {
          data: {
            issue: {
              id: "issue-new-200",
            },
          },
        },
      },
      // Mock for getting issue ID of ENG-100 (blocking)
      {
        queryName: "GetIssueId",
        variables: { id: "ENG-100" },
        response: {
          data: {
            issue: {
              id: "issue-blocking-100",
            },
          },
        },
      },
      // Mock for getting issue ID of ENG-101 (numeric with team)
      {
        queryName: "GetIssueId",
        variables: { id: "ENG-101" },
        response: {
          data: {
            issue: {
              id: "issue-blocking-101",
            },
          },
        },
      },
      // Mock for getting issue ID of ENG-99 (blocked-by)
      {
        queryName: "GetIssueId",
        variables: { id: "ENG-99" },
        response: {
          data: {
            issue: {
              id: "issue-blockedby-99",
            },
          },
        },
      },
      // Mock for creating blocking relation to ENG-100
      {
        queryName: "CreateIssueRelation",
        variables: {
          input: {
            type: "blocks",
            issueId: "issue-new-200",
            relatedIssueId: "issue-blocking-100",
          },
        },
        response: {
          data: {
            issueRelationCreate: {
              success: true,
              issueRelation: {
                id: "relation-1",
              },
            },
          },
        },
      },
      // Mock for creating blocking relation to ENG-101
      {
        queryName: "CreateIssueRelation",
        variables: {
          input: {
            type: "blocks",
            issueId: "issue-new-200",
            relatedIssueId: "issue-blocking-101",
          },
        },
        response: {
          data: {
            issueRelationCreate: {
              success: true,
              issueRelation: {
                id: "relation-2",
              },
            },
          },
        },
      },
      // Mock for creating blocked-by relation from ENG-99
      {
        queryName: "CreateIssueRelation",
        variables: {
          input: {
            type: "blocks",
            issueId: "issue-blockedby-99",
            relatedIssueId: "issue-new-200",
          },
        },
        response: {
          data: {
            issueRelationCreate: {
              success: true,
              issueRelation: {
                id: "relation-3",
              },
            },
          },
        },
      },
    ], { LINEAR_TEAM_ID: "ENG" })

    try {
      await createCommand.parse()
    } finally {
      await cleanup()
    }
  },
})
