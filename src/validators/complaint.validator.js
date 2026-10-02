import Joi from "joi";

const categories = ["Plumbing", "Electrical", "Furniture", "Maintenance", "Other"];

export const createComplaintSchema = Joi.object({
  title: Joi.string().min(3).max(120).required(),
  description: Joi.string().min(3).max(1000).required(),
  category: Joi.string().valid(...categories).required(),
});

// A resident editing their own pending complaint: send any of the three fields.
export const updateComplaintSchema = Joi.object({
  title: Joi.string().min(3).max(120),
  description: Joi.string().min(3).max(1000),
  category: Joi.string().valid(...categories),
}).min(1);

export const updateStatusSchema = Joi.object({
  status: Joi.string().valid("Pending", "In Progress", "Resolved").required(),
});
