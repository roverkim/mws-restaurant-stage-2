/**
 * Common database helper functions.
 */
class DBHelper {

  static idbDatabase() {
    if (!navigator.serviceWorker) {
      return Promise.resolve;
    }
    return idb.open('mws-restaurant', 1, (upgradeDB) => {
      let restaurantDb = upgradeDB.createObjectStore('restaurantDb', {
        keyPath: 'id'
      });
      restaurantDb.createIndex('id', 'id');
    });
  };



  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 8080 // Change this to your server port
    const url = 'http://localhost:1337/restaurants'

    return url;
  }

  /**
   * Fetch all restaurants.
   */

  static handleErrors(response) {
    // If Network failed
    if (!response.ok) {
      // Open Database and get url reference from idb
      DBHelper.idbDatabase().then((db) => {
        if (!db) throw Error(response.statusText);
        let tx = db.transaction('restaurantDb', 'readwrite');
        let store = tx.objectStore('restaurantDb');
        if (store.getAll() <= 0) {
          throw Error(response.statusText);
        }
        return store.getAll();
      });
    }
    return response.json();
  }


  static fetchRestaurants(callback) {
    return fetch(this.DATABASE_URL)
      .then(this.handleErrors)
      .then(res => {
        const restaurants = res;

        // Store Fetched Request in idb
        DBHelper.idbDatabase().then((db) => {
          if (!db) return;
          let tx = db.transaction('restaurantDb', 'readwrite');
          let store = tx.objectStore('restaurantDb');
          restaurants.forEach(function(restaurant) {
            store.put(restaurant);
          });
          // limit store to 30 items
          let data = store.index('id').openCursor(null, "prev").then(function(cursor) {
            return cursor.advance(30);
          }).then(function deleteRest(cursor) {
            if (!cursor) return;
            cursor.delete();
            return cursor.continue().then(deleteRest);
          });

          return store.getAll(); // Return Stored Data
        }).then(restaurants => {
          callback(null, restaurants);
          return restaurants;
        });
      })
      .catch(err => console.log(err))
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    marker.tabindex = -1;
    return marker;
  }

}
