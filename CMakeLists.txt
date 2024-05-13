cmake_minimum_required(VERSION 3.29)

add_subdirectory("libs/glfw")

project("my_game_engine")

file(GLOB_RECURSE MY_SOURCES CONFIGURE_DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/src/*.c")

add_executable("my_game_engine" "${MY_SOURCES}")

target_include_directories("my_game_engine" PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/include")

target_link_libraries("my_game_engine" "glfw")