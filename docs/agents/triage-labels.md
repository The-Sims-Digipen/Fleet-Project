# Triage Labels

| Canonical role    | Local status string | Meaning                                  |
| ----------------- | ------------------- | ---------------------------------------- |
| `needs-triage`    | `needs-triage`      | A maintainer must examine the issue. |
| `needs-info`      | `needs-info`        | The issue needs more information. |
| `ready-for-agent` | `ready-for-agent`   | The specification is complete. An agent can do the work. |
| `ready-for-human` | `ready-for-human`   | A person must do the work. |
| `wontfix`         | `wontfix`           | The maintainer has decided to leave the issue unresolved. |

If a skill specifies a triage role, use the matching local status string in the ticket's `Status:` line.
