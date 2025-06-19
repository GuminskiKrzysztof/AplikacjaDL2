export async function predictImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("http://localhost:5000/predict", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Prediction failed");

  return res.json(); // { class: ..., confidence: ..., image_url: ... }
}
