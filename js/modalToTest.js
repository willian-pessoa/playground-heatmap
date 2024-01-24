const openTestModal = (event) => {
  const modal = document.createElement("div")
  const btn = document.createElement("button")
  const modalContent = document.createElement("div")
  const backdrop = document.createElement("div")

  backdrop.setAttribute("class", "backdrop")
  backdrop.setAttribute("id", "backdrop")

  modalContent.setAttribute("class", "modalContent")
  modalContent.setAttribute("id", "modalContent")

  btn.textContent = "X"
  btn.onclick = closeTestModal
  btn.setAttribute("class", "btn-closeModal")

  modal.setAttribute("class", "modalTeste")
  modal.setAttribute("id", "modalTeste")

  modal.appendChild(btn)
  modal.appendChild(modalContent)

  backdrop.appendChild(modal)

  document.body.appendChild(backdrop)
}

const closeTestModal = () => {
  const modal = document.querySelector(".backdrop")

  modal.remove()
}

const openTestModal2 = () => {
  const modal = document.createElement("div")
  const btn = document.createElement("button")
  const modalContent = document.createElement("div")

  modalContent.setAttribute("class", "modalContent2")
  modalContent.setAttribute("id", "modalContent2")

  btn.textContent = "X"
  btn.onclick = closeTestModal2
  btn.setAttribute("class", "btn-closeModal2")

  modal.setAttribute("class", "modalTeste2")
  modal.setAttribute("id", "modalTeste2")

  modal.appendChild(btn)
  modal.appendChild(modalContent)

  document.body.appendChild(modal)
}

const closeTestModal2 = () => {
  const modal = document.querySelector(".modalTeste2")

  modal.remove()
}
