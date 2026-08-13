import { state } from "../state/state.js";

import { els } from "../utils/dom.js";

import {
  getRanchoPersonas,
  createRanchoPersona,
  getRanchoTurnos,
  saveRanchoTurno,
  getRanchoComidas,
  saveRanchoComida
} from "../services/rancho.service.js";


// ============================================================
// CONFIGURACIÓN
// ============================================================

const ranchoRoles = [
  {
    key: "jefe",
    label: "Jefe de barra",
    max: 2
  },
  {
    key: "caja",
    label: "Caja",
    max: 2
  },
  {
    key: "barra",
    label: "Barra",
    max: 4
  }
];


// ============================================================
// INICIALIZACIÓN
// ============================================================

export function initRancho() {

    // ==========================================================
    // AÑADIR PERSONA
    // ==========================================================
  
    if (els.personForm) {
  
      els.personForm.addEventListener(
        "submit",
        addPerson
      );
  
    }
  
  
    // ==========================================================
    // BOTÓN MOSTRAR FORMULARIO DE PERSONA
    // ==========================================================
  
    const addPersonBtn =
      document.getElementById(
        "ranchoAddPersonBtn"
      );
  
    if (addPersonBtn) {
  
      addPersonBtn.addEventListener(
        "click",
        () => {
  
          if (!els.personForm) {
            return;
          }
  
          els.personForm.classList.remove(
            "hidden"
          );
  
          els.personName?.focus();
  
        }
      );
  
    }
  
  
    // ==========================================================
    // CANCELAR AÑADIR PERSONA
    // ==========================================================
  
    const cancelPersonBtn =
      document.getElementById(
        "ranchoCancelPersonBtn"
      );
  
    if (cancelPersonBtn) {
  
      cancelPersonBtn.addEventListener(
        "click",
        () => {
  
          if (!els.personForm) {
            return;
          }
  
          els.personForm.reset();
  
          els.personForm.classList.add(
            "hidden"
          );
  
        }
      );
  
    }
  
  
    // ==========================================================
    // CAMBIOS EN HORARIO
    // ==========================================================
  
    if (els.ranchoScheduleRows) {
  
      els.ranchoScheduleRows.addEventListener(
        "change",
        updateRanchoSchedule
      );
  
    }
  
  
    // ==========================================================
    // CAMBIOS EN COMIDAS / CENAS
    // ==========================================================
  
    if (els.ranchoMealRows) {
  
      els.ranchoMealRows.addEventListener(
        "change",
        updateRanchoMeal
      );
  
    }
  
  
    // ==========================================================
    // DÍA ANTERIOR
    // ==========================================================
  
    const prevDay =
      document.getElementById(
        "ranchoPrevDay"
      );
  
    if (prevDay) {
  
      prevDay.addEventListener(
        "click",
        () => {
  
          changeRanchoDay(-1);
  
        }
      );
  
    }
  
  
    // ==========================================================
    // DÍA SIGUIENTE
    // ==========================================================
  
    const nextDay =
      document.getElementById(
        "ranchoNextDay"
      );
  
    if (nextDay) {
  
      nextDay.addEventListener(
        "click",
        () => {
  
          changeRanchoDay(1);
  
        }
      );
  
    }
  
  
    // ==========================================================
    // CAMBIO DE DÍA OPERATIVO PRINCIPAL
    // ==========================================================
  
    if (els.entryDate) {
  
      els.entryDate.addEventListener(
        "change",
        async () => {
  
          const loaded =
            await loadRancho();
  
          if (loaded) {
            renderRancho();
          }
  
        }
      );
  
    }
  
  }


function getSelectedRanchoDay() {

    if (
      !state.ranchoCurrent ||
      !state.ranchoCurrent.days?.length
    ) {
      return null;
    }
  
    if (
      state.ranchoCurrent.selectedDay &&
      state.ranchoCurrent.days.includes(
        state.ranchoCurrent.selectedDay
      )
    ) {
      return state.ranchoCurrent.selectedDay;
    }
  
    state.ranchoCurrent.selectedDay =
      state.ranchoCurrent.days[0];
  
    return state.ranchoCurrent.selectedDay;
  }

// ============================================================
// CARGAR RANCHO DESDE SUPABASE
// ============================================================

export async function loadRancho() {

  const date =
    els.entryDate?.value;


  if (!date) {
    return false;
  }


  try {

    // --------------------------------------------------------
    // Calcular semana
    // --------------------------------------------------------

    const {
      start,
      days
    } =
      ranchoWeekBounds(
        date
      );


    const end =
      days[
        days.length - 1
      ];


    // --------------------------------------------------------
    // PERSONAS
    // --------------------------------------------------------

    const {
      data: personas,
      error: personasError
    } =
      await getRanchoPersonas();


    if (personasError) {

      console.error(
        "❌ Error cargando personas del Rancho:",
        personasError
      );

      return false;
    }


    state.ranchoPersonas =
      personas || [];


    state.people =
      state.ranchoPersonas.map(
        (person) =>
          person.nombre
      );


    // --------------------------------------------------------
    // TURNOS
    // --------------------------------------------------------

    const {
      data: turnos,
      error: turnosError
    } =
      await getRanchoTurnos(
        start,
        end
      );


    if (turnosError) {

      console.error(
        "❌ Error cargando turnos del Rancho:",
        turnosError
      );

      return false;
    }


    // --------------------------------------------------------
    // COMIDAS
    // --------------------------------------------------------

    const {
      data: comidas,
      error: comidasError
    } =
      await getRanchoComidas(
        start,
        end
      );


    if (comidasError) {

      console.error(
        "❌ Error cargando comidas del Rancho:",
        comidasError
      );

      return false;
    }


    // --------------------------------------------------------
    // CREAR ESTADO TEMPORAL
    // --------------------------------------------------------

    state.ranchoCurrent = {

        start,

        days,

        selectedDay: date,

        schedule: {},

        meals: {}

    };


    days.forEach(
      (day) => {

        state.ranchoCurrent.schedule[
          day
        ] =
          normalizeScheduleDay();


        state.ranchoCurrent.meals[
          day
        ] =
          normalizeMealDay();

      }
    );


    // --------------------------------------------------------
    // CARGAR TURNOS
    // --------------------------------------------------------

    (turnos || []).forEach(
      (turno) => {

        const day =
          state.ranchoCurrent.schedule[
            turno.fecha
          ];


        if (!day) {
          return;
        }


        const personName =
          turno.rancho_personas?.nombre ||
          "";


        if (
          day[turno.rol] &&
          turno.posicion >= 0 &&
          turno.posicion <
            day[turno.rol].length
        ) {

          day[turno.rol][
            turno.posicion
          ] =
            personName;

        }

      }
    );


    // --------------------------------------------------------
    // CARGAR COMIDAS
    // --------------------------------------------------------

    (comidas || []).forEach(
      (comida) => {

        const day =
          state.ranchoCurrent.meals[
            comida.fecha
          ];


        if (!day) {
          return;
        }


        const personName =
          comida.rancho_personas?.nombre;


        if (!personName) {
          return;
        }


        day[
          comida.tipo
        ].people[
          personName
        ] = {

          signed:
            Boolean(
              comida.apuntado
            ),

          paid:
            Boolean(
              comida.pagado
            ),

          personaId:
            comida.persona_id

        };

      }
    );


    // --------------------------------------------------------
    // PERSONAS DE TURNO
    // Se añaden automáticamente a comida/cena
    // --------------------------------------------------------

    days.forEach(
      (day) => {

        const scheduled =
          scheduledPeople(
            state.ranchoCurrent.schedule[
              day
            ]
          );


        [
          "comida",
          "cena"
        ].forEach(
          (meal) => {

            scheduled.forEach(
              (personName) => {

                if (
                  state.ranchoCurrent
                    .meals[
                      day
                    ][
                      meal
                    ].people[
                      personName
                    ]
                ) {
                  return;
                }


                const person =
                  findPersonByName(
                    personName
                  );


                if (!person) {
                  return;
                }


                state.ranchoCurrent
                  .meals[
                    day
                  ][
                    meal
                  ].people[
                    personName
                  ] = {

                    signed: true,

                    paid: false,

                    personaId:
                      person.id

                  };

              }
            );

          }
        );

      }
    );


    console.log(
      "✅ Rancho cargado desde Supabase:",
      {
        semana:
          start,

        personas:
          personas?.length || 0,

        turnos:
          turnos?.length || 0,

        comidas:
          comidas?.length || 0
      }
    );


    return true;


  } catch (error) {

    console.error(
      "❌ Error inesperado cargando Rancho:",
      error
    );

    return false;

  }

}


// ============================================================
// RENDER GENERAL
// ============================================================

export function renderRancho() {

    if (!state.ranchoCurrent) {
      return;
    }
  
  
    const selectedDay =
      getSelectedRanchoDay();
  
  
    if (!selectedDay) {
      return;
    }
  
  
    renderRanchoDaySelector();
  
    renderRanchoWeekDays();
  
    renderPeople();
  
    renderRanchoSchedule();
  
    renderRanchoMeals();
  
  }


// ============================================================
// RENDER PERSONAS
// ============================================================

function renderPeople() {

    if (!els.peopleList) {
      return;
    }
  
  
    els.peopleList.replaceChildren();
  
  
    const people =
      state.ranchoPersonas || [];
  
  
    people.forEach(
      (person) => {
  
        const chip =
          document.createElement(
            "span"
          );
  
  
        chip.className =
          "rancho-person-chip";
  
  
        chip.textContent =
          person.nombre;
  
  
        els.peopleList.append(
          chip
        );
  
      }
    );
  
  }


// ============================================================
// CALCULAR SEMANA
// SÁBADO → VIERNES
// ============================================================

function ranchoWeekBounds(
  dateValue
) {

  const date =
    new Date(
      `${dateValue}T12:00:00`
    );


  const day =
    date.getDay();


  const saturday =
    new Date(
      date
    );


  saturday.setDate(
    date.getDate() -
    ((day + 1) % 7)
  );


  const days =
    Array.from(
      {
        length: 7
      },
      (_, index) => {

        const item =
          new Date(
            saturday
          );


        item.setDate(
          saturday.getDate() +
          index
        );


        return formatDate(
          item
        );

      }
    );


  return {

    start:
      formatDate(
        saturday
      ),

    days

  };

}


// ============================================================
// NORMALIZAR HORARIO
// ============================================================

function normalizeScheduleDay() {

  return {

    jefe: [
      "",
      ""
    ],

    caja: [
      "",
      ""
    ],

    barra: [
      "",
      "",
      "",
      ""
    ]

  };

}


// ============================================================
// NORMALIZAR COMIDAS
// ============================================================

function normalizeMealDay() {

  return {

    comida: {
      people: {}
    },

    cena: {
      people: {}
    }

  };

}


// ============================================================
// RENDER HORARIO
// ============================================================

function renderRanchoSchedule() {

    if (!els.ranchoScheduleRows) {
      return;
    }
  
  
    const day =
      getSelectedRanchoDay();
  
  
    if (!day) {
      return;
    }
  
  
    const schedule =
      state.ranchoCurrent.schedule[
        day
      ];
  
  
    if (!schedule) {
      return;
    }
  
  
    els.ranchoScheduleRows.replaceChildren();
  
  
    ranchoRoles.forEach(
      (role) => {
  
        const card =
          document.createElement(
            "article"
          );
  
  
        card.className =
          "rancho-shift-card";
  
  
        // ======================================================
        // ROL
        // ======================================================
  
        const roleElement =
          document.createElement(
            "div"
          );
  
  
        roleElement.className =
          "rancho-shift-role";
  
  
        const title =
          document.createElement(
            "strong"
          );
  
  
        title.textContent =
          role.label;
  
  
        const subtitle =
          document.createElement(
            "span"
          );
  
  
        subtitle.textContent =
          role.max === 1
            ? "1 persona"
            : `Hasta ${role.max} personas`;
  
  
        roleElement.append(
          title,
          subtitle
        );
  
  
        // ======================================================
        // PERSONAS
        // ======================================================
  
        const people =
          document.createElement(
            "div"
          );
  
  
        people.className =
          "rancho-shift-people";
  
  
        for (
          let index = 0;
          index < role.max;
          index++
        ) {
  
          const currentName =
            schedule[
              role.key
            ]?.[
              index
            ] || "";
  
  
          const select =
            personSelectByName(
              currentName
            );
  
  
          select.classList.add(
            "rancho-person-select"
          );
  
  
          select.dataset.scheduleDate =
            day;
  
  
          select.dataset.scheduleRole =
            role.key;
  
  
          select.dataset.scheduleIndex =
            index;
  
  
          people.append(
            select
          );
  
        }
  
  
        card.append(
          roleElement,
          people
        );
  
  
        els.ranchoScheduleRows.append(
          card
        );
  
      }
    );
  
  }


// ============================================================
// RENDER COMIDAS / CENAS
// ============================================================

function renderRanchoMeals() {

    if (!els.ranchoMealRows) {
      return;
    }
  
  
    const day =
      getSelectedRanchoDay();
  
  
    if (!day) {
      return;
    }
  
  
    const schedule =
      state.ranchoCurrent.schedule[
        day
      ];
  
  
    const meals =
      state.ranchoCurrent.meals[
        day
      ];
  
  
    if (!schedule || !meals) {
      return;
    }
  
  
    els.ranchoMealRows.replaceChildren();
  
  
    [
      "comida",
      "cena"
    ].forEach(
      (meal) => {
  
        const card =
          document.createElement(
            "article"
          );
  
  
        card.className =
          "rancho-meal-card";
  
  
        // ======================================================
        // CABECERA
        // ======================================================
  
        const header =
          document.createElement(
            "div"
          );
  
  
        header.className =
          "rancho-meal-header";
  
  
        const title =
          document.createElement(
            "h4"
          );
  
  
        title.textContent =
          meal === "comida"
            ? "🍽️ Comida"
            : "🌙 Cena";
  
  
        // ======================================================
        // SELECT PARA AÑADIR PERSONA
        // ======================================================
  
        const addSelect =
          personSelectById("");
  
  
        addSelect.classList.add(
          "rancho-meal-add"
        );
  
  
        addSelect.dataset.mealAddDate =
          day;
  
  
        addSelect.dataset.mealAddType =
          meal;
  
  
        header.append(
          title,
          addSelect
        );
  
  
        // ======================================================
        // PERSONAS
        // ======================================================
  
        const peopleContainer =
          document.createElement(
            "div"
          );
  
  
        peopleContainer.className =
          "rancho-meal-people";
  
  
        const people =
          getMealPeople(
            schedule,
            meals[meal]
          );
  
  
        if (
          people.length === 0
        ) {
  
          const empty =
            document.createElement(
              "p"
            );
  
  
          empty.className =
            "muted";
  
  
          empty.textContent =
            "Todavía no hay nadie apuntado.";
  
  
          peopleContainer.append(
            empty
          );
  
        }
  
  
        people.forEach(
          (personName) => {
  
            const status =
              meals[
                meal
              ].people[
                personName
              ] || {
                signed: false,
                paid: false
              };
  
  
            const row =
              document.createElement(
                "div"
              );
  
  
            row.className =
              "rancho-meal-person";
  
  
            // ==================================================
            // NOMBRE
            // ==================================================
  
            const name =
              document.createElement(
                "span"
              );
  
  
            name.className =
              "rancho-meal-person-name";
  
  
            name.textContent =
              personName;
  
  
            // ==================================================
            // APUNTADO
            // ==================================================
  
            const signedLabel =
              document.createElement(
                "label"
              );
  
  
            signedLabel.className =
              "rancho-checkbox";
  
  
            const signed =
              document.createElement(
                "input"
              );
  
  
            signed.type =
              "checkbox";
  
  
            signed.checked =
              Boolean(
                status.signed
              );
  
  
            signed.dataset.mealSigned =
              personName;
  
  
            signed.dataset.mealDate =
              day;
  
  
            signed.dataset.mealType =
              meal;
  
  
            signedLabel.append(
              signed,
              document.createTextNode(
                "Apuntado"
              )
            );
  
  
            // ==================================================
            // PAGADO
            // ==================================================
  
            const paidLabel =
              document.createElement(
                "label"
              );
  
  
            paidLabel.className =
              "rancho-checkbox";
  
  
            const paid =
              document.createElement(
                "input"
              );
  
  
            paid.type =
              "checkbox";
  
  
            paid.checked =
              Boolean(
                status.paid
              );
  
  
            paid.dataset.mealPaid =
              personName;
  
  
            paid.dataset.mealDate =
              day;
  
  
            paid.dataset.mealType =
              meal;
  
  
            paidLabel.append(
              paid,
              document.createTextNode(
                "💶 Pagado"
              )
            );
  
  
            row.append(
              name,
              signedLabel,
              paidLabel
            );
  
  
            peopleContainer.append(
              row
            );
  
          }
        );
  
  
        card.append(
          header,
          peopleContainer
        );
  
  
        els.ranchoMealRows.append(
          card
        );
  
      }
    );
  
  }

// ============================================================
// SELECT POR NOMBRE
// ============================================================

function personSelectByName(
  value
) {

  const select =
    document.createElement(
      "select"
    );


  addEmptyOption(
    select
  );


  state.ranchoPersonas.forEach(
    (person) => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        person.id;


      option.textContent =
        person.nombre;


      option.selected =
        person.nombre ===
        value;


      select.append(
        option
      );

    }
  );


  return select;

}


// ============================================================
// SELECT POR ID
// ============================================================

function personSelectById(
  value
) {

  const select =
    document.createElement(
      "select"
    );


  addEmptyOption(
    select
  );


  state.ranchoPersonas.forEach(
    (person) => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        person.id;


      option.textContent =
        person.nombre;


      option.selected =
        person.id ===
        value;


      select.append(
        option
      );

    }
  );


  return select;

}


// ============================================================
// OPCIÓN VACÍA
// ============================================================

function addEmptyOption(
  select
) {

  const option =
    document.createElement(
      "option"
    );


  option.value =
    "";


  option.textContent =
    "Seleccionar";


  select.append(
    option
  );

}


// ============================================================
// PERSONAS DE TURNO
// ============================================================

function scheduledPeople(
  scheduleDay
) {

  return ranchoRoles
    .flatMap(
      (role) =>
        scheduleDay[
          role.key
        ] || []
    )
    .filter(Boolean)
    .filter(
      (
        person,
        index,
        list
      ) =>
        list.indexOf(
          person
        ) === index
    );

}


// ============================================================
// PERSONAS DE COMIDA / CENA
// ============================================================

function getMealPeople(
  scheduleDay,
  mealData
) {

  const scheduled =
    scheduledPeople(
      scheduleDay
    );


  return Object.keys(
    mealData.people
  )
    .filter(
      (person) =>
        state.people.includes(
          person
        ) ||
        scheduled.includes(
          person
        )
    )
    .sort(
      (a, b) => {

        const scheduledA =
          scheduled.includes(
            a
          );

        const scheduledB =
          scheduled.includes(
            b
          );


        if (
          scheduledA !==
          scheduledB
        ) {

          return scheduledB -
            scheduledA;

        }


        return a.localeCompare(
          b,
          "es"
        );

      }
    );

}


// ============================================================
// AÑADIR PERSONA
// ============================================================

async function addPerson(
  event
) {

  event.preventDefault();


  const name =
    els.personName.value.trim();


  if (!name) {
    return;
  }


  const exists =
    state.ranchoPersonas.some(
      (person) =>
        person.nombre.toLowerCase() ===
        name.toLowerCase()
    );


  if (exists) {

    alert(
      "Esa persona ya existe."
    );

    return;
  }


  try {

    const {
      data,
      error
    } =
      await createRanchoPersona(
        name
      );


    if (error) {

      console.error(
        "❌ Error creando persona:",
        error
      );


      alert(
        "No se ha podido crear la persona."
      );


      return;
    }


    state.ranchoPersonas.push(
      data
    );


    state.ranchoPersonas.sort(
      (a, b) =>
        a.nombre.localeCompare(
          b.nombre,
          "es"
        )
    );


    state.people =
      state.ranchoPersonas.map(
        (person) =>
          person.nombre
      );


    els.personForm.reset();
    
    els.personForm.classList.add(
        "hidden"
      );


    renderRancho();


    console.log(
      "✅ Persona creada en Supabase:",
      data
    );


  } catch (error) {

    console.error(
      "❌ Error inesperado creando persona:",
      error
    );


    alert(
      "Ha ocurrido un error al crear la persona."
    );

  }

}


// ============================================================
// ACTUALIZAR TURNO
// ============================================================

async function updateRanchoSchedule(
  event
) {

  const select =
    event.target.closest(
      "[data-schedule-date]"
    );


  if (!select) {
    return;
  }


  const {
    scheduleDate,
    scheduleRole,
    scheduleIndex
  } =
    select.dataset;


  try {

    select.disabled =
      true;


    const {
      error
    } =
      await saveRanchoTurno({

        fecha:
          scheduleDate,

        rol:
          scheduleRole,

        posicion:
          Number(
            scheduleIndex
          ),

        personaId:
          select.value ||
          null

      });


    if (error) {

      console.error(
        "❌ Error guardando turno:",
        error
      );


      alert(
        "No se ha podido guardar el turno."
      );


      await loadRancho();

      renderRancho();


      return;
    }


    console.log(
      "✅ Turno guardado en Supabase"
    );


    await loadRancho();

    renderRancho();


  } catch (error) {

    console.error(
      "❌ Error inesperado guardando turno:",
      error
    );


    alert(
      "Ha ocurrido un error al guardar el turno."
    );


  } finally {

    select.disabled =
      false;

  }

}


// ============================================================
// ACTUALIZAR COMIDA / CENA
// ============================================================

async function updateRanchoMeal(
  event
) {

  // ==========================================================
  // AÑADIR PERSONA
  // ==========================================================

  const addSelect =
    event.target.closest(
      "[data-meal-add-date]"
    );


  if (
    addSelect &&
    addSelect.value
  ) {

    const {
      mealAddDate,
      mealAddType
    } =
      addSelect.dataset;


    const person =
      findPersonById(
        addSelect.value
      );


    if (!person) {
      return;
    }


    try {

      addSelect.disabled =
        true;


      const {
        error
      } =
        await saveRanchoComida({

          fecha:
            mealAddDate,

          tipo:
            mealAddType,

          personaId:
            person.id,

          apuntado:
            true,

          pagado:
            false

        });


      if (error) {

        console.error(
          "❌ Error añadiendo persona a comida:",
          error
        );


        alert(
          "No se ha podido añadir la persona."
        );


        return;
      }


      console.log(
        "✅ Persona añadida a comida"
      );


      await loadRancho();

      renderRancho();


    } catch (error) {

      console.error(
        "❌ Error inesperado añadiendo persona:",
        error
      );


      alert(
        "Ha ocurrido un error al añadir la persona."
      );


    } finally {

      addSelect.disabled =
        false;

    }


    return;

  }


  // ==========================================================
  // CHECKBOX
  // ==========================================================

  const checkbox =
    event.target.closest(
      "[data-meal-signed], [data-meal-paid]"
    );


  if (!checkbox) {
    return;
  }


  const personName =
    checkbox.dataset.mealSigned ||
    checkbox.dataset.mealPaid;


  const date =
    checkbox.dataset.mealDate;


  const meal =
    checkbox.dataset.mealType;


  const person =
    findPersonByName(
      personName
    );


  if (!person) {

    console.error(
      "❌ No se encontró la persona:",
      personName
    );


    return;
  }


  const current =
    state.ranchoCurrent
      ?.meals[
        date
      ]?.[
        meal
      ]?.people[
        personName
      ] || {

        signed:
          true,

        paid:
          false

      };


  const newSigned =
    checkbox.dataset.mealSigned
      ? checkbox.checked
      : current.signed;


  const newPaid =
    checkbox.dataset.mealPaid
      ? checkbox.checked
      : current.paid;


  try {

    checkbox.disabled =
      true;


    const {
      data,
      error
    } =
      await saveRanchoComida({

        fecha:
          date,

        tipo:
          meal,

        personaId:
          person.id,

        apuntado:
          newSigned,

        pagado:
          newPaid

      });


    if (error) {

      console.error(
        "❌ Error actualizando comida:",
        error
      );


      alert(
        "No se ha podido actualizar la comida."
      );


      return;
    }


    console.log(
      "✅ Comida actualizada en Supabase:",
      data
    );


    await loadRancho();

    renderRancho();


  } catch (error) {

    console.error(
      "❌ Error inesperado actualizando comida:",
      error
    );


    alert(
      "Ha ocurrido un error al actualizar la comida."
    );


  } finally {

    checkbox.disabled =
      false;

  }

}


// ============================================================
// BUSCAR PERSONA POR NOMBRE
// ============================================================

function findPersonByName(
  name
) {

  return state.ranchoPersonas.find(
    (person) =>
      person.nombre ===
      name
  );

}


// ============================================================
// BUSCAR PERSONA POR ID
// ============================================================

function findPersonById(
  id
) {

  return state.ranchoPersonas.find(
    (person) =>
      person.id ===
      id
  );

}


// ============================================================
// FORMATEAR FECHA
// ============================================================

function formatDate(
  date
) {

  return date
    .toISOString()
    .slice(
      0,
      10
    );

}


// ============================================================
// ETIQUETA DE FECHA
// ============================================================

function dateLabel(
  dateValue
) {

  return new Intl.DateTimeFormat(
    "es-ES",
    {
      weekday:
        "short",

      day:
        "2-digit",

      month:
        "2-digit"
    }
  ).format(
    new Date(
      `${dateValue}T12:00:00`
    )
  );

}

function renderRanchoDaySelector() {

    const day =
      getSelectedRanchoDay();
  
  
    if (!day) {
      return;
    }
  
  
    const date =
      new Date(
        `${day}T12:00:00`
      );
  
  
    const name =
      new Intl.DateTimeFormat(
        "es-ES",
        {
          weekday: "long"
        }
      ).format(date);
  
  
    const shortDate =
      new Intl.DateTimeFormat(
        "es-ES",
        {
          day: "2-digit",
          month: "short"
        }
      )
        .format(date)
        .replace(".", "");
  
  
    const nameEl =
      document.getElementById(
        "ranchoCurrentDayName"
      );
  
  
    const dateEl =
      document.getElementById(
        "ranchoCurrentDayDate"
      );
  
  
    if (nameEl) {
  
      nameEl.textContent =
        name
          .charAt(0)
          .toUpperCase() +
        name.slice(1);
  
    }
  
  
    if (dateEl) {
  
      dateEl.textContent =
        shortDate.toUpperCase();
  
    }
  
  
    const prevBtn =
      document.getElementById(
        "ranchoPrevDay"
      );
  
  
    const nextBtn =
      document.getElementById(
        "ranchoNextDay"
      );
  
  
    const index =
      state.ranchoCurrent.days.indexOf(
        day
      );
  
  
    if (prevBtn) {
  
      prevBtn.disabled =
        index <= 0;
  
    }
  
  
    if (nextBtn) {
  
      nextBtn.disabled =
        index >=
        state.ranchoCurrent.days.length - 1;
  
    }
  
  }

  function renderRanchoWeekDays() {

    const container =
      document.getElementById(
        "ranchoWeekDays"
      );
  
  
    if (!container) {
      return;
    }
  
  
    container.replaceChildren();
  
  
    const selectedDay =
      getSelectedRanchoDay();
  
  
    if (
      !state.ranchoCurrent?.days
    ) {
      return;
    }
  
  
    state.ranchoCurrent.days.forEach(
      (day) => {
  
        const date =
          new Date(
            `${day}T12:00:00`
          );
  
  
        const button =
          document.createElement(
            "button"
          );
  
  
        button.type =
          "button";
  
  
        button.className =
          "rancho-week-day";
  
  
        if (
          day === selectedDay
        ) {
  
          button.classList.add(
            "active"
          );
  
        }
  
  
        const weekday =
          document.createElement(
            "span"
          );
  
  
        weekday.textContent =
          new Intl.DateTimeFormat(
            "es-ES",
            {
              weekday: "short"
            }
          )
            .format(date)
            .replace(".", "");
  
  
        const number =
          document.createElement(
            "strong"
          );
  
  
        number.textContent =
          date.getDate();
  
  
        button.append(
          weekday,
          number
        );
  
  
        button.addEventListener(
          "click",
          () => {
  
            state.ranchoCurrent.selectedDay =
              day;
  
  
            renderRancho();
  
          }
        );
  
  
        container.append(
          button
        );
  
      }
    );
  
  }