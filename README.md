# Pick Better | AI-Powered Nutrition Backend

This repository houses the core engine for **Pick Better**, a high-performance backend designed to decode food labels and provide health insights. The system orchestrates Computer Vision, LLMs, and a multi-tiered data retrieval strategy to transform raw product data into actionable health metrics.

---

## 🏗️ System Architecture

The backend follows a **Modular Monolith** pattern with a focus on asynchronous data pipelines and cost-efficient retrieval.

### **The "Waterfall" Data Strategy**

To minimize latency and external API costs, the system implements a prioritized lookup logic:

1. **L1 Cache (MongoDB Atlas):** Instant retrieval of previously analyzed products.
2. **L2 External (Open Food Facts):** Fallback for verified global product data.
3. **L3 Synthesis (AI Core):** If no data exists, the **OCR Processor** and **Gemini RAG** module dynamically generate a product profile from the user's scan.

<p align="center">
  <img src="architecture.png" alt="Architecture" width="800">
</p>


---

## 🛠️ Technical Stack

* **API Framework:** FastAPI (Python) — utilized for its native `async` support and Pydantic-based data validation.
* **Database:** MongoDB Atlas — serves as both the document store and the vector database for flavor embeddings.
* **AI & LLM:** * **Google Gemini:** Powers the RAG (Retrieval-Augmented Generation) module for ingredient analysis.
* **Sentence-Transformers:** Generates high-dimensional embeddings for flavor-based product matching.


* **Vision & Scraping:** * **EasyOCR / Google Vision API:** For high-accuracy label parsing.
* **Playwright:** An automated background scraper for proactive data seeding.



---

## 🚀 Key Engineering Features

### **1. Deterministic Scoring Engine**

Unlike standard LLM implementations that can hallucinate, our **Scoring Engine** uses a hard-coded logic layer based on **FSSAI (Food Safety and Standards Authority of India)** guidelines. It calculates scores by cross-referencing extracted nutrients (Fats, Sodium, Sugar) against regulatory thresholds.

### **2. Semantic Flavor Embeddings**

We’ve implemented a vector search capability that allows users to find "Better" alternatives not just by category, but by **flavor profile**. By vectorizing ingredient lists, the system can identify products with similar taste notes (e.g., "savory/umami" or "citrusy").

### **3. Proactive Data Seeding**

To ensure a high "L1 Cache" hit rate, the system includes a **Playwright-based Web Scraper**. This background worker periodically crawls e-commerce platforms to seed the database with new products before a user even scans them.

---

## 🚦 API Reference

| Endpoint | Method | Description |
| --- | --- | --- |
| `/v1/scan/barcode` | `POST` | Executes the Waterfall lookup using GTIN/EAN. |
| `/v1/scan/label` | `POST` | Full OCR pipeline for nutritional parsing and FSSAI scoring. |
| `/v1/recommend` | `GET` | Returns alternatives based on Flavor Embeddings + Health Score. |

