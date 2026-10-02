import Joi from "joi";

// full name doubles as a login "username", so it can't contain "@"
// (that's how signin tells a name apart from an email)
const fullNameRule = Joi.string()
  .trim()
  .min(2)
  .max(60)
  .pattern(/^[^@]+$/)
  .messages({ "string.pattern.base": "Full name cannot contain the @ symbol" });

export const signupSchema = Joi.object({
  fullName: fullNameRule.required(),
  building: Joi.string().min(1).max(60).required(),
  unit: Joi.string().min(1).max(20).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(72).required(),
  // role is deliberately NOT accepted here — every signup becomes "resident".
  // The first admin is created directly in the database, by hand.
});

export const signinSchema = Joi.object({
  // either the account email or the full name
  identifier: Joi.string().trim().required().messages({
    "string.empty": "Enter your full name or email",
    "any.required": "Enter your full name or email",
  }),
  password: Joi.string().required(),
});

// Profile page: send only the fields that changed (at least one).
export const updateProfileSchema = Joi.object({
  fullName: fullNameRule,
  building: Joi.string().trim().min(1).max(60),
  unit: Joi.string().trim().min(1).max(20),
  email: Joi.string().trim().lowercase().email(),
  phone: Joi.string()
    .trim()
    .allow("")
    .max(20)
    .pattern(/^[0-9+()\-\s]*$/)
    .messages({ "string.pattern.base": "Phone number can only contain digits, spaces, + ( ) and -" }),
}).min(1);
