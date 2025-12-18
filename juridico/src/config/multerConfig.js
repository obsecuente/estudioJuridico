import multer from "multer";
import path from "path";
import fs from "fs";

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // En multipart/form-data, los campos de texto pueden llegar después
    // Por eso guardamos temporalmente en una carpeta general
    const uploadPath = path.join(process.cwd(), "uploads", "temp");

    // Crear carpeta si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    // Generar nombre único: timestamp_nombreOriginal
    const timestamp = Date.now();
    const nombreLimpio = file.originalname.replace(/\s+/g, "_"); // Reemplazar espacios por _
    const nombreFinal = `${timestamp}_${nombreLimpio}`;
    cb(null, nombreFinal);
  },
});

// Filtro de tipos de archivo permitidos
const fileFilter = (req, file, cb) => {
  const tiposPermitidos = /pdf|jpg|jpeg|png|doc|docx|xls|xlsx/;
  const extname = tiposPermitidos.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = tiposPermitidos.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Tipo de archivo no permitido. Solo: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX"
      ),
      false
    );
  }
};

// Configuración final de Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB máximo por archivo
    files: 10, // Máximo 10 archivos a la vez
  },
  fileFilter: fileFilter,
});

export default upload;
