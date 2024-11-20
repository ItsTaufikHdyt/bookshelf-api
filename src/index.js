const express = require("express");
const bodyParser = require("body-parser");
const { nanoid } = require("nanoid"); // Untuk membuat ID unik

const app = express();
const port = 9000;

// Middleware untuk parsing JSON
app.use(bodyParser.json());

// Simpan data buku dalam array
const books = [];

// Route untuk menambahkan buku
app.post("/books", (req, res) => {
  const {
    name,
    year,
    author,
    summary,
    publisher,
    pageCount,
    readPage,
    reading,
  } = req.body;

  // Validasi: properti name harus ada
  if (!name) {
    return res.status(400).json({
      status: "fail",
      message: "Gagal menambahkan buku. Mohon isi nama buku",
    });
  }

  // Validasi: readPage tidak boleh lebih besar dari pageCount
  if (readPage > pageCount) {
    return res.status(400).json({
      status: "fail",
      message:
        "Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount",
    });
  }

  // Buat ID unik dan timestamp
  const id = nanoid(16);
  const insertedAt = new Date().toISOString();
  const updatedAt = insertedAt;

  // Properti tambahan
  const finished = pageCount === readPage;

  // Buat objek buku baru
  const newBook = {
    id,
    name,
    year,
    author,
    summary,
    publisher,
    pageCount,
    readPage,
    finished,
    reading,
    insertedAt,
    updatedAt,
  };

  // Simpan buku ke array
  books.push(newBook);

  res.status(201).json({
    status: "success",
    message: "Buku berhasil ditambahkan",
    data: {
      bookId: id,
    },
  });
});

// Route untuk menampilkan semua buku
app.get('/books', (req, res) => {
  const { name, reading, finished } = req.query;

  let filteredBooks = books;

  // Filter berdasarkan nama
  if (name) {
    filteredBooks = filteredBooks.filter((book) =>
      book.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  // Filter berdasarkan status "reading"
  if (reading !== undefined) {
    const isReading = reading === '1';
    filteredBooks = filteredBooks.filter((book) => book.reading === isReading);
  }

  // Filter berdasarkan status "finished"
  if (finished !== undefined) {
    const isFinished = finished === '1';
    filteredBooks = filteredBooks.filter((book) => book.finished === isFinished);
  }

  // Format data yang akan dikembalikan
  const responseBooks = filteredBooks.map(({ id, name, publisher }) => ({
    id,
    name,
    publisher,
  }));

  return res.status(200).json({
    status: 'success',
    data: {
      books: responseBooks,
    },
  });
});

// Route untuk menampilkan detail buku berdasarkan ID
app.get("/books/:bookId", (req, res) => {
  const { bookId } = req.params;

  // Cari buku berdasarkan ID
  const book = books.find((b) => b.id === bookId);

  if (!book) {
    // Jika buku tidak ditemukan
    return res.status(404).json({
      status: "fail",
      message: "Buku tidak ditemukan",
    });
  }

  // Jika buku ditemukan
  return res.status(200).json({
    status: "success",
    data: {
      book,
    },
  });
});

app.put("/books/:bookId", (req, res) => {
  const { bookId } = req.params;
  const {
    name,
    year,
    author,
    summary,
    publisher,
    pageCount,
    readPage,
    reading,
  } = req.body;

  // Validasi: Properti "name" tidak ada
  if (!name) {
    return res.status(400).json({
      status: "fail",
      message: "Gagal memperbarui buku. Mohon isi nama buku",
    });
  }

  // Validasi: readPage lebih besar dari pageCount
  if (readPage > pageCount) {
    return res.status(400).json({
      status: "fail",
      message:
        "Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount",
    });
  }

  // Cari indeks buku berdasarkan ID
  const bookIndex = books.findIndex((book) => book.id === bookId);

  // Validasi: Buku tidak ditemukan
  if (bookIndex === -1) {
    return res.status(404).json({
      status: "fail",
      message: "Gagal memperbarui buku. Id tidak ditemukan",
    });
  }

  // Update data buku
  const updatedAt = new Date().toISOString();
  books[bookIndex] = {
    ...books[bookIndex],
    name,
    year,
    author,
    summary,
    publisher,
    pageCount,
    readPage,
    reading,
    finished: pageCount === readPage,
    updatedAt,
  };

  // Respons sukses
  return res.status(200).json({
    status: "success",
    message: "Buku berhasil diperbarui",
  });
});

app.delete("/books/:bookId", (req, res) => {
  const { bookId } = req.params;

  // Cari indeks buku berdasarkan ID
  const bookIndex = books.findIndex((book) => book.id === bookId);

  // Validasi: Buku tidak ditemukan
  if (bookIndex === -1) {
    return res.status(404).json({
      status: "fail",
      message: "Buku gagal dihapus. Id tidak ditemukan",
    });
  }

  // Hapus buku dari array
  books.splice(bookIndex, 1);

  // Respons sukses
  return res.status(200).json({
    status: "success",
    message: "Buku berhasil dihapus",
  });
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
