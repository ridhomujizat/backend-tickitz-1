const showtimeModel = require('../models/showtimes')
const validation = require('../helpers/validation')
const response = require('../helpers/response')

exports.createShowtime = async (req, res) => {
  const valid = validation.validationShowtime(req.body)

  if (valid.error) {
    return res.status(400).json({
      success: false,
      message: valid.error.details[0].message
    })
  }
  try {
    const data = req.body
    const selectedShowtime = data.showtime
    const showtimeData = {
      idCinema: data.idCinema,
      idMovie: data.idMovie
    }
    if (typeof selectedShowtime === 'object') {
      await showtimeModel.createCinemaShowtimes(showtimeData.idCinema, showtimeData.idMovie, selectedShowtime)
    }
    if (typeof selectedShowtime === 'string') {
      await showtimeModel.createCinemaShowtimes(showtimeData.idCinema, showtimeData.idMovie, [selectedShowtime])
    }
    const finalResult = await showtimeModel.getShowtimeWithCinemaAndMovie(showtimeData.idMovie)
    if (finalResult.length > 0) {
      return response(res, 200, true, 'Create data success', {
        id: finalResult[0].id,
        movie: finalResult[0].movie,
        cinema: finalResult[0].cinema,
        showtime: finalResult.map(item => item.showtime)
      })
    }
    return response(res, 400, false, 'Failed to create showtime')
  } catch (error) {
    return response(res, 400, false, 'Bad Request')
  }
}

exports.listCinemaShowtime = async (req, res) => {
  try {
    const { search } = req.body
    const resultSearch = await showtimeModel.getLocationCinema(search)
    if (resultSearch.length > 0) {
      const cinema = await showtimeModel.getCinema()
      const showtime = await showtimeModel.getShowtime()
      const hash = Object.create(null)
      const result = cinema.map(((hash) => (cinema) => (hash[cinema.id] = { id: cinema.id, name: cinema.name, location: cinema.location, address: cinema.address, price: cinema.price, showtime: [] }))(hash))

      showtime.forEach((hash => showtime => hash[showtime.idCinema].showtime.push({ id: showtime.id, name: showtime.showtime }))(hash))

      return response(res, 200, true, 'List of Cinema Showtime', result)
    }
    return response(res, 404, false, `Location ${search} not exists`)
  } catch (error) {
    return response(res, 400, false, 'Bad Request')
  }
}

exports.updateShowtime = async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body
    const selectedShowtime = data.showtime
    const showtimeData = {
      idCinema: data.idCinema,
      idMovie: data.idMovie
    }
    const initialResult = await showtimeModel.getShowtimeWithCinemaAndMovie(id)
    if (initialResult.length > 0) {
      const results = await showtimeModel.getCinemaShowtimeById(id)
      const idShowtime = results.map((item) => item.id)
      if (typeof selectedShowtime === 'object') {
        if (selectedShowtime.length === results.length) {
          for (let i = 0; i < idShowtime.length; i++) {
            await showtimeModel.updateCinemaShowtime(idShowtime[i], selectedShowtime[i])
          }
          await showtimeModel.updateShowtime(id, showtimeData)
          return response(res, 200, true, 'Updated successfully', { ...initialResult[0], ...data })
        } else if (selectedShowtime.length > results.length) {
          for (let i = 0; i < idShowtime.length; i++) {
            await showtimeModel.updateCinemaShowtime(idShowtime[i], selectedShowtime[i])
          }
          await showtimeModel.createCinemaShowtimes(showtimeData.idCinema, id, selectedShowtime.slice(results.length, selectedShowtime.length))
          await showtimeModel.updateShowtime(id, showtimeData)
          return response(res, 200, true, 'Updated successfully', { ...initialResult[0], ...data })
        } else if (selectedShowtime.length < results.length) {
          for (let i = 0; i < selectedShowtime.length; i++) {
            await showtimeModel.updateCinemaShowtime(idShowtime[i], selectedShowtime[i])
          }
          await showtimeModel.deleteCinemaShowtimeById(idShowtime.slice(selectedShowtime.length))
          await showtimeModel.updateShowtime(id, showtimeData)
          return response(res, 200, true, 'Updated successfully', { ...initialResult[0], ...data })
        }
      }
      if (typeof selectedShowtime === 'string') {
        await showtimeModel.updateCinemaShowtime(idShowtime[0], selectedShowtime)
        await showtimeModel.deleteCinemaShowtimeById(idShowtime.slice([selectedShowtime].length))
        await showtimeModel.updateShowtime(id, showtimeData)
        return response(res, 200, true, 'Updated successfully', { ...initialResult[0], ...data })
      }
    } else {
      return response(res, 400, false, 'Failed to update showtime')
    }
  } catch (error) {
    return response(res, 400, false, 'Bad Request')
  }
}

exports.deleteShowtime = async (req, res) => {
  try {
    const { id } = req.params
    const initialResult = await showtimeModel.getShowtimesById(id)
    if (initialResult.length > 0) {
      const results = await showtimeModel.deleteShowtimeById(id)
      if (results) {
        return response(res, 200, true, `Showtime id ${id} deleted successfully`, initialResult[0])
      }
    }
    return response(res, 400, false, `Failed to delete showtime id ${id}`)
  } catch (error) {
    return response(res, 400, false, 'Bad Request')
  }
}