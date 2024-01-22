const openTestModal = () => {
  const modal = document.createElement("div")
  const btn = document.createElement("button")
  const modalContent = document.createElement("div")

  modalContent.setAttribute("class", "modalContent")

  btn.textContent = "X"
  btn.onclick = closeTestModal
  btn.setAttribute("class", "btn-closeModal")

  modal.setAttribute("class", "modalTeste")

  modal.appendChild(btn)
  modal.appendChild(modalContent)

  document.body.appendChild(modal)
}

const closeTestModal = () => {
  const modal = document.querySelector(".modalTeste")

  modal.remove()
}