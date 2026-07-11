import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // React Three Fiber / three.js: o modelo é IMPERATIVO por design — mutar
  // câmera, refs e materiais dentro de useFrame, e usar Math.random()/relógio
  // no loop de render. As checagens do React Compiler (react-hooks/*) tratam
  // isso como impuro/mutação proibida (falso-positivo). Desligadas SÓ nos
  // arquivos das cenas 3D; o resto do projeto mantém as regras.
  {
    files: [
      "src/components/snowmania/**/*.{ts,tsx}",
      "src/components/landing/HeroScene.tsx",
    ],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
