const http = require('http');
const { nanoid } = require('nanoid');
const url = require('url');

// Simpan data buku dalam array
const books = [];

// Membuat server HTTP
const server = http.createServer((req, res) => {
  const { method, url: reqUrl } = req;
  const { pathname, query } = url.parse(reqUrl, true);

  // Set header untuk response JSON
  res.setHeader('Content-Type', 'application/json');

  // Menghandle request POST untuk menambah buku
  if (method === 'POST' && pathname === '/books') {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      const { name, year, author, summary, publisher, pageCount, readPage, reading } = JSON.parse(body);

      // Validasi: properti name harus ada
      if (!name) {
        res.statusCode = 400;
        return res.end(JSON.stringify({
          status: "fail",
          message: "Gagal menambahkan buku. Mohon isi nama buku",
        }));
      }

      // Validasi: readPage tidak boleh lebih besar dari pageCount
      if (readPage > pageCount) {
        res.statusCode = 400;
        return res.end(JSON.stringify({
          status: "fail",
          message: "Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount",
        }));
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

      // Kirim response sukses
      res.statusCode = 201;
      res.end(JSON.stringify({
        status: "success",
        message: "Buku berhasil ditambahkan",
        data: { bookId: id },
      }));
    });
  }

  // Menghandle request GET untuk menampilkan semua buku
  else if (method === 'GET' && pathname === '/books') {
    let filteredBooks = books;

    // Filter berdasarkan query params
    const { name, reading, finished } = query;

    if (name) {
      filteredBooks = filteredBooks.filter(book => book.name.toLowerCase().includes(name.toLowerCase()));
    }

    if (reading !== undefined) {
      const isReading = reading === '1';
      filteredBooks = filteredBooks.filter(book => book.reading === isReading);
    }

    if (finished !== undefined) {
      const isFinished = finished === '1';
      filteredBooks = filteredBooks.filter(book => book.finished === isFinished);
    }

    // Format data yang akan dikembalikan
    const responseBooks = filteredBooks.map(({ id, name, publisher }) => ({
      id,
      name,
      publisher,
    }));

    res.statusCode = 200;
    return res.end(JSON.stringify({
      status: 'success',
      data: { books: responseBooks },
    }));
  }

  // Menghandle request GET untuk menampilkan detail buku berdasarkan ID
  else if (method === 'GET' && pathname.startsWith('/books/')) {
    const bookId = pathname.split('/')[2];
    const book = books.find(b => b.id === bookId);

    if (!book) {
      res.statusCode = 404;
      return res.end(JSON.stringify({
        status: "fail",
        message: "Buku tidak ditemukan",
      }));
    }

    res.statusCode = 200;
    return res.end(JSON.stringify({
      status: "success",
      data: { book },
    }));
  }

  // Menghandle request PUT untuk memperbarui buku
  else if (method === 'PUT' && pathname.startsWith('/books/')) {
    const bookId = pathname.split('/')[2];
    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      const { name, year, author, summary, publisher, pageCount, readPage, reading } = JSON.parse(body);

      // Validasi: Properti "name" tidak ada
      if (!name) {
        res.statusCode = 400;
        return res.end(JSON.stringify({
          status: "fail",
          message: "Gagal memperbarui buku. Mohon isi nama buku",
        }));
      }

      // Validasi: readPage lebih besar dari pageCount
      if (readPage > pageCount) {
        res.statusCode = 400;
        return res.end(JSON.stringify({
          status: "fail",
          message: "Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount",
        }));
      }

      // Cari indeks buku berdasarkan ID
      const bookIndex = books.findIndex(book => book.id === bookId);

      // Validasi: Buku tidak ditemukan
      if (bookIndex === -1) {
        res.statusCode = 404;
        return res.end(JSON.stringify({
          status: "fail",
          message: "Gagal memperbarui buku. Id tidak ditemukan",
        }));
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

      res.statusCode = 200;
      return res.end(JSON.stringify({
        status: "success",
        message: "Buku berhasil diperbarui",
      }));
    });
  }

  // Menghandle request DELETE untuk menghapus buku
  else if (method === 'DELETE' && pathname.startsWith('/books/')) {
    const bookId = pathname.split('/')[2];

    // Cari indeks buku berdasarkan ID
    const bookIndex = books.findIndex(book => book.id === bookId);

    // Validasi: Buku tidak ditemukan
    if (bookIndex === -1) {
      res.statusCode = 404;
      return res.end(JSON.stringify({
        status: "fail",
        message: "Buku gagal dihapus. Id tidak ditemukan",
      }));
    }

    // Hapus buku dari array
    books.splice(bookIndex, 1);

    res.statusCode = 200;
    return res.end(JSON.stringify({
      status: "success",
      message: "Buku berhasil dihapus",
    }));
  }

  // Jika route tidak ditemukan
  else {
    res.statusCode = 404;
    return res.end(JSON.stringify({
      status: "fail",
      message: "Not Found",
    }));
  }
});

// Jalankan server
const port = 9000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
