async function run() {
  try {
    const res = await fetch("http://localhost:3000/api/recommendations?page=1&limit=10");
    const data = await res.text();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}
run();
