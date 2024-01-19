const openTestModal = () => {
  const modal = document.createElement("div")
  const btn = document.createElement("button")

  btn.textContent = "X"
  btn.onclick = closeTestModal

  modal.setAttribute("class", "modalTeste")

  modal.appendChild(btn)

  document.body.appendChild(modal)
}

const closeTestModal = () => {
  const modal = document.querySelector(".modalTeste")

  modal.remove()
}