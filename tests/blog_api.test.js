const { describe, test, beforeEach, after } = require("node:test");
const assert = require("assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/blog");

const api = supertest(app);

const initialBlogs = [
  {
    title: "Introduction to JavaScript",
    author: "John Doe",
    url: "https://example.com/javascript-intro",
    likes: 10,
  },
  {
    title: "Understanding MongoDB",
    author: "Jane Smith",
    url: "https://example.com/mongodb-guide",
    likes: 25,
  },
];

describe("Blog API tests", () => {
  beforeEach(async () => {
    await Blog.deleteMany({});
    await Blog.insertMany(initialBlogs);
  });

  test("blogs are returned as json", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("blog posts have an 'id' property instead of '_id'", async () => {
    const response = await api.get("/api/blogs");

    response.body.forEach((blog) => {
      assert(blog.id, "Blog post should have an 'id' property");
      assert(!blog._id, "Blog post should not have an '_id' property");
    });
  });

  test("a valid blog can be added", async () => {
    const newBlog = {
      title: "Mastering Async/Await in JavaScript",
      author: "Jane Doe",
      url: "https://example.com/async-await",
      likes: 15,
    };

    await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const response = await api.get("/api/blogs");
    const titles = response.body.map((b) => b.title);

    assert.strictEqual(response.body.length, initialBlogs.length + 1);
    assert(titles.includes("Mastering Async/Await in JavaScript"));
  });

  test("if likes property is missing, it defaults to 0", async () => {
    const newBlog = {
      title: "Learning JavaScript Closures",
      author: "Alice Johnson",
      url: "https://example.com/js-closures",
      // 'likes' property is intentionally missing
    };

    const response = await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    assert.strictEqual(response.body.likes, 0, "Likes should default to 0");
  });
  test("blog without title is not added", async () => {
    const newBlog = {
      author: "No Title Author",
      url: "https://example.com/missing-title",
      likes: 5,
    };

    await api.post("/api/blogs").send(newBlog).expect(400); // Expecting Bad Request

    const response = await api.get("/api/blogs");

    assert.strictEqual(
      response.body.length,
      initialBlogs.length,
      "Blog count should not increase"
    );
  });

  test("blog without url is not added", async () => {
    const newBlog = {
      title: "No URL Blog",
      author: "No URL Author",
      likes: 8,
    };

    await api.post("/api/blogs").send(newBlog).expect(400); // Expecting Bad Request

    const response = await api.get("/api/blogs");

    assert.strictEqual(
      response.body.length,
      initialBlogs.length,
      "Blog count should not increase"
    );
  });

  test("a blog can be deleted", async () => {
    const response = await api.get("/api/blogs");
    const blogToDelete = response.body[0];

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

    const blogsAtEnd = await api.get("/api/blogs");

    assert.strictEqual(blogsAtEnd.body.length, initialBlogs.length - 1);
    assert(
      !blogsAtEnd.body.some((b) => b.id === blogToDelete.id),
      "Blog is deleted"
    );
  });

  after(async () => {
    await mongoose.connection.close();
  });
});
