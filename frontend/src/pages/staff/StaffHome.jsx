function StaffHome() {
  const name = localStorage.getItem("name");

  return (
    <div>
      <h1>Welcome Staff 👋</h1>
      <h3>{name}</h3>
    </div>
  );
}

export default StaffHome;