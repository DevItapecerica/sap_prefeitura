import { generateRandomPassword } from "../../utils/generateRandomPassword.js";
import { PasswordGenerator } from "./password-generator.interface.js";

export class RandomPasswordGenerator implements PasswordGenerator {
  generate(): string {
    return generateRandomPassword();
  }
}
