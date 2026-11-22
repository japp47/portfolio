/**
 * GLSL for the dot terrain. The height of every dot is a sum of sine waves; on load each dot
 * starts at a random height (binary noise) and eases onto the surface as uIntro goes 0 → 1.
 */

export const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntro;
  uniform vec2 uMouse;
  uniform float uMouseOn;
  uniform float uPixel;
  attribute float aSeed;
  varying float vAlpha;

  float surface(vec2 p, float t) {
    return 0.22 * sin(p.x * 1.15 + t * 0.35) * cos(p.y * 0.9 - t * 0.25)
         + 0.09 * sin(p.x * 2.6 - p.y * 1.9 + t * 0.6)
         + 0.05 * cos(length(p) * 3.0 - t * 0.8);
  }

  void main() {
    vec3 pos = position;
    float height = surface(pos.xz, uTime);

    // a soft bump under the pointer, kept away from the far edge where it would alias
    float d = distance(pos.xz, uMouse);
    float bump = uMouseOn * 0.42 * exp(-d * d * 2.2) * smoothstep(-3.0, -0.6, pos.z);

    // intro: random height first, the surface later; each dot arrives at its own time
    float noise = (aSeed - 0.5) * 2.4;
    float settled = smoothstep(0.0, 1.0, clamp(uIntro * 1.4 - aSeed * 0.4, 0.0, 1.0));
    pos.y = mix(noise, height + bump, settled);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = uPixel * (2.2 + bump * 4.0) * (6.0 / depth);

    // fade the sides, the distance and the far rows so the terrain has no hard edge
    float edge = smoothstep(4.6, 2.6, abs(pos.x))
               * smoothstep(7.6, 4.6, depth)
               * smoothstep(-3.5, -1.6, position.z);
    float lit = 0.28 + 0.55 * smoothstep(-0.25, 0.3, height + bump);
    vAlpha = edge * lit * mix(0.5, 1.0, settled);
  }
`;

export const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    gl_FragColor = vec4(uColor, vAlpha * smoothstep(0.5, 0.2, r));
  }
`;
