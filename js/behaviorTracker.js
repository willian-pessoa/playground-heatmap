let GLOBAL_TRACK_DATA = {}
let GLOBAL_MOUSE_DATA = {}

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

const addHeatMapIdToDOMElements = () => {
  for (const elementKey in GLOBAL_MOUSE_DATA) {
    const { idCssSelector, id, clickData } = GLOBAL_MOUSE_DATA[elementKey]

    if (clickData.length && idCssSelector) {
      const element = document.body.querySelector(convertCustomCssSelector(idCssSelector))

      if (!element) continue

      if (!element.__heatmap_node_map_id__) {
        element.__heatmap_node_map_id__ = id
      }
    }
  }
}

const getEffectingArea = (element) => {
  const { top, left, right, bottom } = element.getBoundingClientRect()

  return { top, left, right, bottom }
}

const isNotPositionStatic = (element) => {
  const computedStyle = window.getComputedStyle(element);
  return computedStyle.position !== "static" && computedStyle.position !== "relative";
}

const getChildrenMapKeys = (element) => {
  const childrenKeys = []
  for (const child of element.children) {
    if (child.__heatmap_node_map_id__ && !isNotPositionStatic(child)) {
      const children = {}
      children.childrenKey = child.__heatmap_node_map_id__
      children.associateElements = []

      if (child.children.length) {
        children.associateElements = getChildrenMapKeys(child)
      }
      childrenKeys.push(children)
    }
  }
  return childrenKeys
}

const convertCustomCssSelector = (cssSelector) => {
  if (!cssSelector) return null

  let newCssSelector = cssSelector

  const bracketsRegex = /\[(\d+)\]/g

  if (bracketsRegex.test(cssSelector)) {
    newCssSelector = cssSelector.replaceAll(bracketsRegex, "nth-of-type($1)");
  }

  return newCssSelector
}

const getSiblingTypeIndex = (element) => {
  if (!element || !element.parentElement?.children) return 0

  let siblingIndex = 0

  for (let item of element.parentElement.children) {
    if (item.__heatmap_node_map_id__ === element.__heatmap_node_map_id__) {
      return siblingIndex
    }

    if (item.nodeName !== element.nodeName) continue

    siblingIndex++
  }

  return siblingIndex
}

const getNodeName = (element) => {
  if (!element) return

  let nodeName = element.nodeName.toLowerCase()
  let idElement = element.id
  let siblingIndex = getSiblingTypeIndex(element)

  if (idElement) {
    return `#${idElement}`
  }

  return !siblingIndex ? nodeName : `${nodeName}:[${siblingIndex + 1}]`
}

const getParentsElements = (element) => {
  if (!element) return ""

  if (!element.parentElement) return "body"

  if (element.parentElement.nodeName === "BODY") return "body"

  if (element.parentElement) {
    let parentNodeName = " > " + getNodeName(element.parentElement)

    return getParentsElements(element.parentElement) + parentNodeName
  } else {
    return " > "
  }
}

const getElementCssSelector = (element) => {
  if (!element) return

  let idCssSelector = ""

  let nodeName = getNodeName(element)
  let parents = getParentsElements(element)

  idCssSelector = parents + " > " + nodeName

  return idCssSelector
}

const getMapElementByIdCssSelector = (idCssSelector) => {
  for (const elementKey in GLOBAL_MOUSE_DATA) {
    const { idCssSelector: cssSelector, id } = GLOBAL_MOUSE_DATA[elementKey]
    if (cssSelector === idCssSelector) {
      return id
    }
  }

  return null
}

const pushMouseClickEventData = (event) => {
  event.stopPropagation()

  // compute the relative position inside the element
  const { offsetX, offsetY } = event
  const { __heatmap_node_map_id__, scrollHeight, scrollWidth } = event.target

  const posX = offsetX / scrollWidth
  const posY = offsetY / scrollHeight

  // If element not in the elements DOM maping, add to it with the click
  if (!__heatmap_node_map_id__) {
    const idCssSelector = getElementCssSelector(event.target)

    const hashNodeMapId = getMapElementByIdCssSelector(idCssSelector)

    if (hashNodeMapId) {
      GLOBAL_MOUSE_DATA[hashNodeMapId].clickData.push({
        time: Date.now(),
        posX,
        posY
      })

      GLOBAL_MOUSE_DATA[hashNodeMapId].clicks++

      return
    }

    const countId = GLOBAL_TRACK_DATA.nodeAmount

    event.target.__heatmap_node_map_id__ = countId

    GLOBAL_MOUSE_DATA[countId] = {
      id: countId,
      idCssSelector,
      clicks: 1,
      clickData: [{ time: Date.now(), posX, posY }],
      moveData: [],
    }

    GLOBAL_TRACK_DATA.nodeAmount = countId + 1

    return
  }

  // push the relative position to the dom element maping
  const nodeMapId = __heatmap_node_map_id__

  GLOBAL_MOUSE_DATA[nodeMapId].clickData.push({
    time: Date.now(),
    posX,
    posY
  })

  GLOBAL_MOUSE_DATA[nodeMapId].clicks++
}

const pushMouseMoveEventData = (event) => {
  const { offsetX, offsetY } = event

  const { __heatmap_node_map_id__, scrollHeight, scrollWidth } = event.target

  const nodeMapId = __heatmap_node_map_id__

  const posX = offsetX / scrollWidth
  const posY = offsetY / scrollHeight

  if (!posX || !posY) {
    event.stopPropagation()
    return
  }

  GLOBAL_MOUSE_DATA[nodeMapId].moveData.push({
    time: Date.now(),
    posX,
    posY
  })

  event.stopPropagation()
}

const getMouseDataFromApi = () => {
  const TRACK_DATA = JSON.parse(localStorage.getItem("TRACK_DATA"))
  console.log("🚀 ~ TRACK_DATA:", TRACK_DATA)

  if (TRACK_DATA) {
    GLOBAL_MOUSE_DATA = TRACK_DATA.data
  }
}

const trackMouse = () => {
  GLOBAL_TRACK_DATA.pageUrl = window.location.href
  GLOBAL_TRACK_DATA.startRecordAt = Date.now()

  const body = document.querySelector("body");
  const elements = body.querySelectorAll("*");

  let countId = 1

  document.addEventListener("click", pushMouseClickEventData)

  elements.forEach((element) => {
    // Add the mouse event
    //element.addEventListener("click", pushMouseClickEventData)
    element.addEventListener("mousemove", normalizeFPS(pushMouseMoveEventData))

    // Add the element a uniqueId with a css selector to the element
    element["__heatmap_node_map_id__"] = countId
    GLOBAL_MOUSE_DATA[countId] = {
      id: countId,
      idCssSelector: getElementCssSelector(element),
      clicks: 0,
      clickData: [],
      moveData: [],
    }

    countId++
  });

  GLOBAL_TRACK_DATA.nodeAmount = countId

  return
};

const isCordinateInside = (cordinate, canOverlapElements) => {
  for (element of canOverlapElements) {
    const { top, left, bottom, right } = element.effectingArea
    const { x, y } = cordinate

    if (x > left && x < right && y < bottom && y > top) {
      return true
    }
  }

  return false
}

const paintHeatmap = (data, max) => {
  console.log("🚀 ~ data:", data)
  const heatMapContainer = document.createElement("div")
  //data.push({ x: 0, y: 0 })

  heatMapContainer.setAttribute("class", "heatmap")
  heatMapContainer.style.position = "absolute"
  heatMapContainer.style.width = "100%"
  heatMapContainer.style.height = "100%"
  heatMapContainer.style.top = 0
  heatMapContainer.style.left = 0
  heatMapContainer.style.pointerEvents = "none"
  heatMapContainer.style.backgroundColor = "transparent"

  const heatMap = document.createElement("div")
  heatMap.style.width = "100%"
  heatMap.style.height = "100%"
  heatMap.style.pointerEvents = "none"
  heatMap.style.opacity = "0.5"
  heatMap.style.zIndex = "10000"
  heatMap.style.backgroundColor = "rgb(0, 0, 0);"

  heatMapContainer.appendChild(heatMap)
  document.body.appendChild(heatMapContainer)

  // Iniciar o heatmap definindo o container dele
  // estou utilizando a tag HTML que vem de documentElement
  const heatmap = h337.create({
    container: heatMap,
  });

  const update = () => {
    // Max é o número máximo de pontos para ficar vermelha a área
    // data é uma array de objetos. O objeto deve possui { x: Number, y: Number}
    heatmap.setData({
      max,
      data,
    });
    requestAnimationFrame(update);
  };

  update();
};

const plotClicks = () => {
  console.time("Plot Clicks")

  addHeatMapIdToDOMElements()

  const cordinates = []
  const canOverlapElements = []

  // COMPUTE X,Y to PLOT
  for (const elementKey in GLOBAL_MOUSE_DATA) {
    const { idCssSelector, clickData } = GLOBAL_MOUSE_DATA[elementKey]

    if (clickData.length && idCssSelector) {
      const element = document.body.querySelector(convertCustomCssSelector(idCssSelector))

      if (!element) continue

      if (isNotPositionStatic(element)) {
        canOverlapElements.push({
          elementKey,
          associateElements: getChildrenMapKeys(element),
          effectingArea: getEffectingArea(element)
        })
        continue
      }

      const rect = element.getBoundingClientRect()

      const elementWidth = element.scrollWidth
      const elementHeight = element.scrollHeight
      const elementPosX = rect.left
      const elementPosY = rect.top

      for (click of clickData) {
        const { posX, posY } = click

        const x = (elementWidth * posX) + elementPosX
        const y = (elementHeight * posY) + elementPosY

        cordinates.push({ x, y })
      }
    }
  }

  // FILTER PLOTS IN THE OVERLAPING AREAS
  const filteredCordinates = cordinates.filter((cordinate) => {
    return !isCordinateInside(cordinate, canOverlapElements)
  })


  // RE-COMPUTE PLOTS ADD THE OVERLAP ELEMENTS THAT WASN'T INCLUDE 
  for (const overlapingElement of canOverlapElements) {

    // PLOT THE OWN ELEMENT
    const { idCssSelector, clickData } = GLOBAL_MOUSE_DATA[overlapingElement.elementKey]

    if (clickData.length && idCssSelector) {
      const element = document.body.querySelector(convertCustomCssSelector(idCssSelector))

      if (!element) continue

      const rect = element.getBoundingClientRect()

      const elementWidth = element.scrollWidth
      const elementHeight = element.scrollHeight
      const elementPosX = rect.left
      const elementPosY = rect.top

      for (click of clickData) {
        const { posX, posY } = click

        const x = (elementWidth * posX) + elementPosX
        const y = (elementHeight * posY) + elementPosY

        filteredCordinates.push({ x, y })
      }
    }

    // LOOP OVER ASSOCIATE ELEMENTES USING RECURSIVITY
    const plotAssociateElements = (associateElements) => {
      if (!associateElements.length) return

      for (const associateElement of associateElements) {
        const { idCssSelector, clickData } = GLOBAL_MOUSE_DATA[associateElement.childrenKey]

        if (clickData.length && idCssSelector) {
          const element = document.body.querySelector(convertCustomCssSelector(idCssSelector))

          if (!element) continue

          const rect = element.getBoundingClientRect()

          const elementWidth = element.scrollWidth
          const elementHeight = element.scrollHeight
          const elementPosX = rect.left
          const elementPosY = rect.top

          for (click of clickData) {
            const { posX, posY } = click

            const x = (elementWidth * posX) + elementPosX
            const y = (elementHeight * posY) + elementPosY

            filteredCordinates.push({ x, y })
          }
        }

        plotAssociateElements(associateElement.associateElements)
      }
    }

    plotAssociateElements(overlapingElement.associateElements)
  }

  paintHeatmap(filteredCordinates, 2)

  console.timeEnd("Plot Clicks")
}

const plotMovement = () => {
  console.time("Plot Movement")

  addHeatMapIdToDOMElements()

  const cordinates = []
  const canOverlapElements = []

  // COMPUTE X,Y to PLOT
  for (const elementKey in GLOBAL_MOUSE_DATA) {
    const { idCssSelector, moveData } = GLOBAL_MOUSE_DATA[elementKey]

    if (moveData.length && idCssSelector) {
      const element = document.body.querySelector(convertCustomCssSelector(idCssSelector))

      if (!element) continue

      if (isNotPositionStatic(element)) {
        canOverlapElements.push({
          elementKey,
          associateElements: getChildrenMapKeys(element),
          effectingArea: getEffectingArea(element)
        })
        continue
      }

      const rect = element.getBoundingClientRect()

      const elementWidth = element.scrollWidth
      const elementHeight = element.scrollHeight
      const elementPosX = rect.left
      const elementPosY = rect.top

      for (move of moveData) {
        const { posX, posY } = move

        const x = (elementWidth * posX) + elementPosX
        const y = (elementHeight * posY) + elementPosY

        cordinates.push({ x, y })
      }
    }
  }

  // FILTER PLOTS IN THE OVERLAPING AREAS
  const filteredCordinates = cordinates.filter((cordinate) => {
    return !isCordinateInside(cordinate, canOverlapElements)
  })


  // RE-COMPUTE PLOTS ADD THE OVERLAP ELEMENTS THAT WASN'T INCLUDE 
  for (const overlapingElement of canOverlapElements) {

    // PLOT THE OWN ELEMENT
    const { idCssSelector, moveData } = GLOBAL_MOUSE_DATA[overlapingElement.elementKey]

    if (moveData.length && idCssSelector) {
      const element = document.body.querySelector(convertCustomCssSelector(idCssSelector))

      if (!element) continue

      const rect = element.getBoundingClientRect()

      const elementWidth = element.scrollWidth
      const elementHeight = element.scrollHeight
      const elementPosX = rect.left
      const elementPosY = rect.top

      for (move of moveData) {
        const { posX, posY } = move

        const x = (elementWidth * posX) + elementPosX
        const y = (elementHeight * posY) + elementPosY

        filteredCordinates.push({ x, y })
      }
    }

    // LOOP OVER ASSOCIATE ELEMENTES USING RECURSIVITY
    const plotAssociateElements = (associateElements) => {
      if (!associateElements.length) return

      for (const associateElement of associateElements) {
        const { idCssSelector, moveData } = GLOBAL_MOUSE_DATA[associateElement.childrenKey]

        if (moveData.length && idCssSelector) {
          const element = document.body.querySelector(convertCustomCssSelector(idCssSelector))

          if (!element) continue

          const rect = element.getBoundingClientRect()

          const elementWidth = element.scrollWidth
          const elementHeight = element.scrollHeight
          const elementPosX = rect.left
          const elementPosY = rect.top

          for (move of moveData) {
            const { posX, posY } = move

            const x = (elementWidth * posX) + elementPosX
            const y = (elementHeight * posY) + elementPosY

            filteredCordinates.push({ x, y })
          }
        }

        plotAssociateElements(associateElement.associateElements)
      }
    }

    plotAssociateElements(overlapingElement.associateElements)
  }

  paintHeatmap(filteredCordinates, 8)

  console.timeEnd("Plot Movement")
}

const removePlots = () => {
  const element = document.body.querySelector(".heatmap")

  if (!element) return

  element.remove()
}

const onUnloadAddDataToStorage = () => {
  addEventListener('beforeunload', () => {
    GLOBAL_TRACK_DATA.endRecortAt = Date.now()

    const TRACK_DATA = {
      ...GLOBAL_TRACK_DATA,
      data: GLOBAL_MOUSE_DATA
    }

    localStorage.setItem("TRACK_DATA", JSON.stringify(TRACK_DATA))
  });
}

const startTrackingMouse = () => {
  trackMouse()
  onUnloadAddDataToStorage()
  getMouseDataFromApi()
}

startTrackingMouse()