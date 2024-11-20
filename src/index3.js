const Hapi = require('@hapi/hapi');
const { nanoid } = require('nanoid');

// Simpan data buku dalam array
const books = [];

const init = async () => {
  const server = Hapi.server({
    port: 9000,
    host: 'localhost',
  });

  // Route untuk menambahkan buku
  server.route({
    method: 'POST',
    path: '/books',
    handler: (request, h) => {
      const { name, year, author, summary, publisher, pageCount, readPage, reading } = request.payload;

      // Validasi: properti name harus ada
      if (!name) {
        return h.response({
          status: 'fail',
          message: 'Gagal menambahkan buku. Mohon isi nama buku',
        }).code(400);
      }

      // Validasi: readPage tidak boleh lebih besar dari pageCount
      if (readPage > pageCount) {
        return h.response({
          status: 'fail',
          message: 'Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount',
        }).code(400);
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

      return h.response({
        status: 'success',
        message: 'Buku berhasil ditambahkan',
        data: { bookId: id },
      }).code(201);
    },
  });

  // Route untuk menampilkan semua buku
  server.route({
    method: 'GET',
    path: '/books',
    handler: (request, h) => {
      const { name, reading, finished } = request.query;

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

      return h.response({
        status: 'success',
        data: {
          books: responseBooks,
        },
      }).code(200);
    },
  });

  // Route untuk menampilkan detail buku berdasarkan ID
  server.route({
    method: 'GET',
    path: '/books/{bookId}',
    handler: (request, h) => {
      const { bookId } = request.params;

      const book = books.find((b) => b.id === bookId);

      if (!book) {
        return h.response({
          status: 'fail',
          message: 'Buku tidak ditemukan',
        }).code(404);
      }

      return h.response({
        status: 'success',
        data: { book },
      }).code(200);
    },
  });

  // Route untuk memperbarui buku berdasarkan ID
  server.route({
    method: 'PUT',
    path: '/books/{bookId}',
    handler: (request, h) => {
      const { bookId } = request.params;
      const { name, year, author, summary, publisher, pageCount, readPage, reading } = request.payload;

      // Validasi: Properti "name" tidak ada
      if (!name) {
        return h.response({
          status: 'fail',
          message: 'Gagal memperbarui buku. Mohon isi nama buku',
        }).code(400);
      }

      // Validasi: readPage lebih besar dari pageCount
      if (readPage > pageCount) {
        return h.response({
          status: 'fail',
          message: 'Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount',
        }).code(400);
      }

      // Cari indeks buku berdasarkan ID
      const bookIndex = books.findIndex((book) => book.id === bookId);

      if (bookIndex === -1) {
        return h.response({
          status: 'fail',
          message: 'Gagal memperbarui buku. Id tidak ditemukan',
        }).code(404);
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

      return h.response({
        status: 'success',
        message: 'Buku berhasil diperbarui',
      }).code(200);
    },
  });

  // Route untuk menghapus buku berdasarkan ID
  server.route({
    method: 'DELETE',
    path: '/books/{bookId}',
    handler: (request, h) => {
      const { bookId } = request.params;

      // Cari indeks buku berdasarkan ID
      const bookIndex = books.findIndex((book) => book.id === bookId);

      if (bookIndex === -1) {
        return h.response({
          status: 'fail',
          message: 'Buku gagal dihapus. Id tidak ditemukan',
        }).code(404);
      }

      // Hapus buku dari array
      books.splice(bookIndex, 1);

      return h.response({
        status: 'success',
        message: 'Buku berhasil dihapus',
      }).code(200);
    },
  });

  // Jalankan server
  await server.start();
  console.log('Server running on %s', server.info.uri);
};

// Menjalankan server Hapi
init();
