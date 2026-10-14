// Runnable check: node states-smoke.mjs
// The OA gate requires entity.state === "WY"; the UI form and legacy rows store
// full names like "Wyoming". toStateCode() is the single converter between them.
import assert from "node:assert/strict";
import { toStateCode, stateLabel } from "./src/react-app/lib/states.ts";

assert.equal(toStateCode("Wyoming"), "WY");
assert.equal(toStateCode("wyoming"), "WY");
assert.equal(toStateCode("WY"), "WY");
assert.equal(toStateCode("wy"), "WY");
assert.equal(toStateCode("Delaware"), "DE");
assert.equal(toStateCode(""), "");
assert.equal(toStateCode(null), "");
assert.equal(toStateCode(undefined), "");

assert.equal(stateLabel("WY"), "Wyoming");
assert.equal(stateLabel("Wyoming"), "Wyoming");
assert.equal(stateLabel("wy"), "Wyoming");

console.log("states-smoke: OK");
