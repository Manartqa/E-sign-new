import { describe, expect, it } from "vitest";
import { MOCK_ROLES, rolesOf } from "./roles.mock";

describe("rolesOf", () => {
  it("adds up the permissions of every role, once each", () => {
    const { roles, permissions } = rolesOf(["RL-002", "RL-004"]);
    expect(roles.map((role) => role.id)).toEqual(["RL-002", "RL-004"]);
    // both roles grant APPLICATIONS:VIEW — it appears once
    expect(permissions.filter((key) => key === "APPLICATIONS:VIEW")).toHaveLength(1);
    expect(permissions).toContain("APPLICATIONS:APPROVE"); // from RL-002
    expect(permissions).toContain("USERS:DELETE"); // from RL-004
  });

  it("drops an id that is no longer a role", () => {
    expect(rolesOf(["RL-999"])).toEqual({ roles: [], permissions: [] });
  });

  it("reads the roles as they are now", () => {
    const role = MOCK_ROLES.find((item) => item.id === "RL-005")!;
    const before = role.name;
    role.name = "renamed";
    expect(rolesOf(["RL-005"]).roles).toEqual([{ id: "RL-005", name: "renamed" }]);
    role.name = before;
  });
});
