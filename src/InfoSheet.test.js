// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { InfoSheet } from "./SharedComponents.jsx";

let root;
const mount = (el) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  flushSync(() => root.render(el));
};

afterEach(() => {
  if (root) flushSync(() => root.unmount());
  root = null;
  document.body.innerHTML = "";
});

describe("InfoSheet", () => {
  it("viser titel og tekst i en dialog på document.body", () => {
    mount(React.createElement(InfoSheet, { title: "Hvad er krydskontaminering?", onClose() {} }, "Forklaring her"));
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain("Hvad er krydskontaminering?");
    expect(dialog.textContent).toContain("Forklaring her");
  });

  it("lukker via Forstået-knappen og ved tryk udenfor, men ikke ved tryk i arket", () => {
    let closed = 0;
    mount(React.createElement(InfoSheet, { title: "T", onClose: () => { closed++; } }, "Tekst"));
    const dialog = document.body.querySelector('[role="dialog"]');
    dialog.click();
    expect(closed).toBe(0);
    [...dialog.querySelectorAll("button")].find(b => b.textContent === "Forstået").click();
    expect(closed).toBe(1);
    dialog.parentElement.click();
    expect(closed).toBe(2);
  });
});
