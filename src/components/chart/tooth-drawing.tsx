import type { Arch, ToothShape } from "@/domain/teeth/catalog";
import type { ToothView } from "@/domain/teeth/derive";

/**
 * Tooth outlines drawn for this app in the style of the sample charts (thin outline, crown line).
 * Paths are in a 40×56 box with the crown at the top (lower jaw); upper teeth are the same paths flipped,
 * so the roots point up and the crowns of both arches face the horizontal divider.
 */
const SHAPES: Record<ToothShape, { outline: string; crown: string }> = {
  incisor: {
    outline: "M14.5 9Q14.5 5.500 20 5.500Q25.500 5.500 25.500 9L24.300 47Q24.300 50.500 20 50.500Q15.700 50.500 15.700 47Z",
    crown: "M14.800 17H25.200",
  },
  canine: {
    outline: "M20 3.500C26.500 14 28.500 30 26.500 44Q24.500 52.500 20 52.500Q15.500 52.500 13.500 44C11.500 30 13.500 14 20 3.500Z",
    crown: "M13.200 25Q20 28 26.800 25",
  },
  twoRoot: {
    outline:
      "M9 51Q6.800 51 7.600 47C8.600 30 11.500 14 20 4.500C28.500 14 31.400 30 32.400 47Q33.200 51 31 51Q29 51 28.200 48L22.300 30Q20 25.500 17.700 30L11.800 48Q11 51 9 51Z",
    crown: "M11.800 22.500Q20 18.500 28.200 22.500",
  },
  roundTwoRoot: {
    outline:
      "M9 51Q6.800 51 7.600 47L8.600 15Q8.600 5.500 20 5.500Q31.400 5.500 31.400 15L32.400 47Q33.200 51 31 51Q29 51 28.200 48L23 29Q20 24.500 17 29L11.800 48Q11 51 9 51Z",
    crown: "M9 20.500Q20 17 31 20.500",
  },
  wideTwoRoot: {
    outline:
      "M7.500 51Q5.300 51 6 47C5.600 34 5.800 20 8.600 9.500Q10.800 5 14 8L20 14L26 8Q29.200 5 31.400 9.500C34.200 20 34.400 34 34 47Q34.700 51 32.500 51Q30.500 51 29.700 48L24 30Q20 24.500 16 30L10.300 48Q9.500 51 7.500 51Z",
    crown: "M7.800 24.500Q20 20.500 32.200 24.500",
  },
  threeRoot: {
    outline:
      "M8 10.500Q8 5.500 13 5.500H27Q32 5.500 32 10.500L31 46.500Q31 50.500 29 50.500Q27 50.500 27 47.500L25.300 34.500Q24.500 31.500 23.700 34.500L22.800 44.500Q22.400 47.500 20 47.500Q17.600 47.500 17.200 44.500L16.300 34.500Q15.500 31.500 14.700 34.500L13 47.500Q13 50.500 11 50.500Q9 50.500 9 46.500Z",
    crown: "M8.300 20.500Q20 23.500 31.700 20.500",
  },
};

const PAINT: Record<ToothView["fill"], { stroke: string; fill: string }> = {
  none: { stroke: "var(--tooth-stroke)", fill: "#fff" },
  calculus: { stroke: "var(--mark-calculus-stroke)", fill: "var(--mark-calculus-fill)" },
  fracture: { stroke: "var(--mark-fracture)", fill: "var(--mark-fracture-fill)" },
  extraction: { stroke: "var(--mark-extraction-stroke)", fill: "var(--mark-extraction-fill)" },
  missing: { stroke: "var(--mark-missing)", fill: "var(--mark-missing-fill)" },
};

export function ToothDrawing({
  shape,
  arch,
  width,
  view,
  selected,
  className,
}: {
  shape: ToothShape;
  arch: Arch;
  /** Relative width of the tooth (1 = widest). */
  width: number;
  view: ToothView;
  selected: boolean;
  className?: string;
}) {
  const { outline, crown } = SHAPES[shape];
  const paint = PAINT[view.fill];
  const flip = arch === "upper" ? "translate(0 56) scale(1 -1)" : undefined;
  const squeeze = `translate(20 0) scale(${width} 1) translate(-20 0)`;
  const cross = view.cross === "none" ? null : view.cross === "extraction" ? "var(--mark-extraction)" : "var(--mark-missing)";

  return (
    <svg viewBox="0 0 40 56" className={className} aria-hidden focusable="false" preserveAspectRatio="xMidYMid meet">
      {selected ? (
        <rect x="1.500" y="1.500" width="37" height="53" rx="6" fill="none" stroke="var(--primary-strong)" strokeWidth="1.500" strokeDasharray="3 2.500" />
      ) : null}
      {view.ring ? <ellipse cx="20" cy="28" rx="16.500" ry="25" fill="none" stroke="var(--mark-radiograph)" strokeWidth="1.800" /> : null}
      <g transform={flip}>
        <g transform={squeeze}>
          <path d={outline} fill={paint.fill} stroke={paint.stroke} strokeWidth="1.600" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <path d={crown} fill="none" stroke={paint.stroke} strokeWidth="1" strokeOpacity="0.550" vectorEffect="non-scaling-stroke" />
        </g>
      </g>
      {cross ? (
        <path d="M8 9L32 47M32 9L8 47" fill="none" stroke={cross} strokeWidth="2.400" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}
