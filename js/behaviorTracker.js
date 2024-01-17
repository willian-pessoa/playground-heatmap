const normalizeFPS = callback => {
  let ticking = true;
  const update = () => {
    if (ticking) requestAnimationFrame(update);
    ticking = true;
  };
  return event => {
    if (ticking) {
      callback(event);
      update();
    }
    ticking = false;
  };
};

const trackMouse = () => {
  const mouseTrack = {
    user: "Teste",
    pageUrl: window.location.href,
    windowsSize: {
      height: window.innerHeight,
      width: window.innerWidth,
    },
    startRecordAt: Date.now(),
  }

  const data = []

  // Envia as coordenadas X / Y, Timestamp e tipo de evento
  const pushEventData = ({ pageX, pageY, type, clientX, clientY, target }) => {
    if (type === "click") {
      let TotalX = document.body.scrollWidth
      let TotalY = document.body.scrollHeight
      let posX = (pageX * 100) / TotalX
      let posY = (pageY * 100) / TotalY

      console.log("Pos: " + posX + "," + posY)
      console.log("Page: " + pageX + "," + pageY)

      data.push({
        time: Date.now(),
        pageX, //position relative to page screen
        pageY,
        clientX, //
        clientY,
        posX,
        posY,
        type,
      });
    }
  };

  //document.addEventListener("mousemove", normalizeFPS(pushEventData));
  document.addEventListener("click", pushEventData);

  mouseTrack.data = data

  return mouseTrack
};

const plotClicks = (cordinates) => {
  let TotalX = document.body.scrollWidth
  let TotalY = document.body.scrollHeight

  cordinates.forEach(cord => {
    const dot = document.createElement("div")

    const x = TotalX * cord.posX / 100
    const y = TotalY * cord.posY / 100

    dot.className = "dot"
    dot.style.position = "absolute"
    dot.style.width = "10px"
    dot.style.height = "10px"
    dot.style.borderRadius = "50%"
    dot.style.backgroundColor = "yellow"
    dot.style.border = "1px solid black"
    dot.style.top = y + "px"
    dot.style.left = x + "px"

    document.body.appendChild(dot)
  })
}

const mouseData = trackMouse()