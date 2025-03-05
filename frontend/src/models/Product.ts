import * as Yup from "yup";

export const ProductSchema = Yup.object({
  id: Yup.string().uuid().required().default(""),
  title: Yup.string().required().defined().default(""),
  description: Yup.string().optional().default(""),
  price: Yup.number().min(0).required().defined().default(0),
});

export const AvailableProductSchema = ProductSchema.shape({
  count: Yup.number().integer().min(0).defined().default(0),
});

export type Product = Yup.InferType<typeof ProductSchema>;
export type AvailableProduct = Yup.InferType<typeof AvailableProductSchema>;
