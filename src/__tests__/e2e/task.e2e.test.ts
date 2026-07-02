import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { vi } from "vitest";
import testPrisma from "./setup.js";

// Mock the prisma singleton to use the test client
vi.mock("../../lib/prisma.js", () => ({
	default: testPrisma,
}));

// Import app AFTER mocking prisma
const { default: app } = await import("../../app.js");
import request from "supertest";

describe("Task API E2E Tests", () => {
	beforeEach(async () => {
		// Clean up database between tests
		await testPrisma.task.deleteMany();
	});

	afterAll(async () => {
		await testPrisma.$disconnect();
	});

	describe("POST /api/tasks", () => {
		it("should create a new task", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ title: "E2E Task", description: "E2E Description" });

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty("id");
			expect(res.body.title).toBe("E2E Task");
			expect(res.body.description).toBe("E2E Description");
			expect(res.body.completed).toBe(false);
		});

		it("should return 400 when title is missing", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ description: "No title" });

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Title is required and must be a non-empty string");
		});

		it("should return 400 when title is empty", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ title: "   " });

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Title is required and must be a non-empty string");
		});
	});

	// ... TODO: Add more tests
	
	describe("GET /api/tasks", () => {
		it("should retrieve all tasks", async () => {
			// Create a task first
			await testPrisma.task.create({
				data: { title: "Task 1", description: "Description 1" },
			});

			const res = await request(app).get("/api/tasks");

			expect(res.status).toBe(200);
			expect(res.body.length).toBe(1);
			expect(res.body[0].title).toBe("Task 1");
		});	
	});

	describe("GET /api/tasks/:id", () => {
		it("should retrieve a task by ID", async () => {
			const task = await testPrisma.task.create({
				data: { title: "Task 2", description: "Description 2" },
			});

			const res = await request(app).get(`/api/tasks/${task.id}`);

			expect(res.status).toBe(200);
			expect(res.body.title).toBe("Task 2");
		});

		it("should return 404 when task does not exist", async () => {
			const res = await request(app).get("/api/tasks/9999");

			expect(res.status).toBe(404);
			expect(res.body.error).toBe("Task not found");
		});

		it("should return 400 for invalid task ID", async () => {
			const res = await request(app).get("/api/tasks/invalid");

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid task ID");
		});
	});

	describe("PUT /api/tasks/:id", () => {
		it("should update a task", async () => {
			const task = await testPrisma.task.create({
				data: { title: "Task 3", description: "Description 3" },
			});

			const res = await request(app)
				.put(`/api/tasks/${task.id}`)
				.send({ title: "Updated Task 3", completed: true });

			expect(res.status).toBe(200);
			expect(res.body.title).toBe("Updated Task 3");
			expect(res.body.completed).toBe(true);
		});

		it("should return 404 when task to update does not exist", async () => {
			const res = await request(app)
				.put("/api/tasks/9999")
				.send({ title: "Updated Task" });

			expect(res.status).toBe(404);
			expect(res.body.error).toBe("Task not found");
		});

		it("should return 400 for invalid task ID in update", async () => {
			const res = await request(app)
				.put("/api/tasks/invalid")
				.send({ title: "Updated Task" });

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid task ID");
		});
	});

	describe("DELETE /api/tasks/:id", () => {
		it("should delete a task", async () => {
			const task = await testPrisma.task.create({
				data: { title: "Task 4", description: "Description 4" },
			});

			const res = await request(app).delete(`/api/tasks/${task.id}`);

			expect(res.status).toBe(204);

			// Verify the task is deleted
			const deletedTask = await testPrisma.task.findUnique({
				where: { id: task.id },
			});
			expect(deletedTask).toBeNull();
		});

		it("should return 404 when task to delete does not exist", async () => {
			const res = await request(app).delete("/api/tasks/9999");

			expect(res.status).toBe(404);
			expect(res.body.error).toBe("Task not found");
		});

		it("should return 400 for invalid task ID in delete", async () => {
			const res = await request(app).delete("/api/tasks/invalid");

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid task ID");
		});
	});
	
});
