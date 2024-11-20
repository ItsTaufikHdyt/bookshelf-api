const http = require("http");
const { nanoid } = require("nanoid");

const port = 9000;
const books = [];

// Fungsi untuk mengurai body JSON
const parseJSONBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
  });

// Fungsi untuk mengirim respons
const sendResponse = (res, statusCode, data) => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};

// Handler untuk setiap permintaan
const requestHandler = async (req, res) => {
  const { method, url } = req;

  // Route untuk menambahkan buku
  if (method === "POST" && url === "/books") {
    try {
      const body = await parseJSONBody(req);

      const {
        name,
        year,
        author,
        summary,
        publisher,
        pageCount,
        readPage,
        reading,
      } = body;

      // Validasi
      if (!name) {
        return sendResponse(res, 400, {
          status: "fail",
          message: "Gagal menambahkan buku. Mohon isi nama buku",
        });
      }
      if (readPage > pageCount) {
        return sendResponse(res, 400, {
          status: "fail",
          message:
            "Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount",
        });
      }

      const id = nanoid(16);
      const insertedAt = new Date().toISOString();
      const updatedAt = insertedAt;
      const finished = pageCount === readPage;

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

      books.push(newBook);

      return sendResponse(res, 201, {
        status: "success",
        message: "Buku berhasil ditambahkan",
        data: {
          bookId: id,
        },
      });
    } catch (error) {
      return sendResponse(res, 500, { status: "error", message: error.message });
    }
  }

  // Route untuk mendapatkan semua buku
  if (method === "GET" && url.startsWith("/books")) {
    const query = new URL(req.url, `http://localhost:${port}`).searchParams;
    const name = query.get("name");
    const reading = query.get("reading");
    const finished = query.get("finished");

    let filteredBooks = books;

    if (name) {
      filteredBooks = filteredBooks.filter((book) =>
        book.name.toLowerCase().includes(name.toLowerCase())
      );
    }
    if (reading !== null) {
      filteredBooks = filteredBooks.filter(
        (book) => book.reading === (reading === "1")
      );
    }
    if (finished !== null) {
      filteredBooks = filteredBooks.filter(
        (book) => book.finished === (finished === "1")
      );
    }

    const responseBooks = filteredBooks.map(({ id, name, publisher }) => ({
      id,
      name,
      publisher,
    }));

    return sendResponse(res, 200, {
      status: "success",
      data: {
        books: responseBooks,
      },
    });
  }

  // Route untuk mendapatkan buku berdasarkan ID
  if (method === "GET" && url.startsWith("/books/")) {
    const bookId = url.split("/")[2];
    const book = books.find((b) => b.id === bookId);

    if (!book) {
      return sendResponse(res, 404, {
        status: "fail",
        message: "Buku tidak ditemukan",
      });
    }

    return sendResponse(res, 200, {
      status: "success",
      data: {
        book,
      },
    });
  }

  // Route untuk mengupdate buku
  if (method === "PUT" && url.startsWith("/books/")) {
    const bookId = url.split("/")[2];
    try {
      const body = await parseJSONBody(req);
      const {
        name,
        year,
        author,
        summary,
        publisher,
        pageCount,
        readPage,
        reading,
      } = body;

      if (!name) {
        return sendResponse(res, 400, {
          status: "fail",
          message: "Gagal memperbarui buku. Mohon isi nama buku",
        });
      }
      if (readPage > pageCount) {
        return sendResponse(res, 400, {
          status: "fail",
          message:
            "Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount",
        });
      }

      const bookIndex = books.findIndex((b) => b.id === bookId);
      if (bookIndex === -1) {
        return sendResponse(res, 404, {
          status: "fail",
          message: "Gagal memperbarui buku. Id tidak ditemukan",
        });
      }

      const updatedAt = new Date().toISOString();
      books[bookIndex] = {
        ...books[bookIndex],
        ...body,
        finished: pageCount === readPage,
        updatedAt,
      };

      return sendResponse(res, 200, {
        status: "success",
        message: "Buku berhasil diperbarui",
      });
    } catch (error) {
      return sendResponse(res, 500, { status: "error", message: error.message });
    }
  }

  // Route untuk menghapus buku
  if (method === "DELETE" && url.startsWith("/books/")) {
    const bookId = url.split("/")[2];
    const bookIndex = books.findIndex((b) => b.id === bookId);

    if (bookIndex === -1) {
      return sendResponse(res, 404, {
        status: "fail",
        message: "Buku gagal dihapus. Id tidak ditemukan",
      });
    }

    books.splice(bookIndex, 1);

    return sendResponse(res, 200, {
      status: "success",
      message: "Buku berhasil dihapus",
    });
  }

  // Route tidak ditemukan
  return sendResponse(res, 404, {
    status: "fail",
    message: "Route tidak ditemukan",
  });
};

// Jalankan server
const server = http.createServer(requestHandler);
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
