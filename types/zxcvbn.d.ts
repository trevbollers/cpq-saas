declare module "zxcvbn" {
  interface ZXCVBNResult {
    score: 0 | 1 | 2 | 3 | 4;
    feedback: { warning: string; suggestions: string[] };
  }
  function zxcvbn(password: string): ZXCVBNResult;
  export default zxcvbn;
}
