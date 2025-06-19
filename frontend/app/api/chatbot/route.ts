export async function askChatbot(text: string) {
  const res = await fetch("http://localhost:5000/chatbot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) throw new Error("Chatbot failed");
  const data = await res.json();
  return data.response_text;
}
