async function run() {
  try {
    const res = await fetch("http://localhost:3000/api/stories?type=Story");
    const data = await res.text();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}
run();
