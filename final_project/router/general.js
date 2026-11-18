const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;

const public_users = express.Router();

const BOOKS_API_URL = process.env.BOOKS_API_URL ||
  'http://127.0.0.1:5001/_internal/books';

async function fetchBooks() {
  const response = await axios.get(BOOKS_API_URL, {
    timeout: 5000
  });
  return response.data;
}

function handleAxiosError(res, error) {
  console.error('Axios error:', error.message);

  if (error.response) {
    return res.status(error.response.status).json({
      message: 'Unable to retrieve books'
    });
  }

  return res.status(502).json({
    message: 'Book catalogue is unavailable'
  });
}

// Register a new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password required"
    });
  }

  if (isValid(username)) {
    return res.status(409).json({
      message: "Username already exists"
    });
  }

  users.push({ username, password });
  return res.status(200).json({
    message: "User registered successfully"
  });
});

// Get all books using Axios
public_users.get('/', async (req, res) => {
  try {
    const books = await fetchBooks();
    return res.status(200).json(books);
  } catch (error) {
    return handleAxiosError(res, error);
  }
});

// Get book details based on ISBN using Axios
public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const books = await fetchBooks();

    const book = books[req.params.isbn] ||
      Object.values(books).find(
        item => String(item.isbn) === req.params.isbn
      );

    if (!book) {
      return res.status(404).json({
        message: "Book not found"
      });
    }

    return res.status(200).json(book);
  } catch (error) {
    return handleAxiosError(res, error);
  }
});

// Get book details based on author using Axios
public_users.get('/author/:author', async (req, res) => {
  try {
    const books = await fetchBooks();
    const author = req.params.author.trim().toLowerCase();

    const result = Object.values(books).filter(
      book => String(book.author || '').trim().toLowerCase() === author
    );

    return res.status(200).json(result);
  } catch (error) {
    return handleAxiosError(res, error);
  }
});

// Get books based on title using Axios
public_users.get('/title/:title', async (req, res) => {
  try {
    const books = await fetchBooks();
    const title = req.params.title.trim().toLowerCase();

    const result = Object.values(books).filter(
      book => String(book.title || '').toLowerCase().includes(title)
    );

    return res.status(200).json(result);
  } catch (error) {
    return handleAxiosError(res, error);
  }
});

// Get book review
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];

  if (!book) {
    return res.status(404).json({
      message: "Book not found"
    });
  }

  return res.status(200).json(book.reviews);
});

module.exports.general = public_users;
