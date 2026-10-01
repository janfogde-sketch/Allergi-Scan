import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AppHeader from "./AppHeader.jsx";

const render = (props) => renderToStaticMarkup(React.createElement(AppHeader, { onFeedback() {}, onMenu() {}, ...props }));
// Prikken er det eneste element med en grøn 9x9-cirkel på menuknappen.
const hasDot = (html) => html.includes("width:9px;height:9px");

describe("AppHeader — prik ved hamburgermenuen", () => {
  it("vises ikke, når der ingen ulæste beskeder er", () => {
    const html = render({ unread: 0 });
    expect(hasDot(html)).toBe(false);
    expect(html).toContain('aria-label="Åbn menu"');
  });
  it("vises ikke uden unread-prop (fx på alle andre skærme som før)", () => {
    expect(hasDot(render({}))).toBe(false);
  });
  it("vises ved ulæste beskeder og siger det i knappens label", () => {
    expect(hasDot(render({ unread: 1 }))).toBe(true);
    expect(render({ unread: 1 })).toContain("1 ulæste besked)");
    expect(render({ unread: 3 })).toContain("3 ulæste beskeder)");
  });
});
