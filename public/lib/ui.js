import { h, render, Fragment } from "https://esm.sh/preact@10.19.3";
import { useState, useEffect, useMemo, useRef } from "https://esm.sh/preact@10.19.3/hooks";
import { useSignal, useComputed } from "https://esm.sh/@preact/signals@1.2.3";
import htm from "https://esm.sh/htm@3.1.1";

export const html = htm.bind(h);
export { h, render, Fragment, useState, useEffect, useMemo, useRef, useSignal, useComputed };
