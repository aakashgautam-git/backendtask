import { Request, Response } from "express";
import { getProducts } from "../services/product.service";
import { CATEGORIES } from "../constants/categories";

export async function getProductsController(
  req: Request,
  res: Response
) {
  try {
    const limit = Number(req.query.limit) || 20;

    const cursor =
      typeof req.query.cursor === "string"
        ? req.query.cursor
        : undefined;

    const category =
      typeof req.query.category === "string"
        ? req.query.category
        : undefined;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: "limit must be between 1 and 100",
      });
    }

    if (category && !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
      return res.status(400).json({
        error: "Invalid category",
        allowedCategories: CATEGORIES,
      });
    }

    const result = await getProducts({
      limit,
      cursor,
      category,
    });

    return res.json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}