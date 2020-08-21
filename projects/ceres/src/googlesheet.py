import os

import gspread
from gspread.models import Cell
from oauth2client.service_account import ServiceAccountCredentials

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://spreadsheets.google.com/feeds',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/spreadsheets']

# The ID and range of a sample spreadsheet.
SAMPLE_SPREADSHEET_ID = '1Vk12gCE8vN0J8FntS91bZBC3cIQmgtbv227ua_JloOU'


def load_model():
    print('Loading model...')
    creds = ServiceAccountCredentials.from_json_keyfile_name(
        'credentials.json', SCOPES)
    client = gspread.authorize(creds)
    model = client.open_by_key(SAMPLE_SPREADSHEET_ID)
    return model


def inference(model, req, context):
    """Shows basic usage of the Sheets API.
    Prints values from a sample spreadsheet.
    """
    print('request:', req)
    sheetName = req['sheet'] or 'prad'
    pp_cell, pp_value = req['pp'].split(':')
    etp_cell, etp_value = req['etp'].split(':')
    cdc_cell, cdc_value = req['cdc'].split(':')
    pmp_cell, pmp_value = req['pmp'].split(':')
    da_cell, da_value = req['da'].split(':')
    cr_cell, cr_value = req['da'].split(':')

    table_row = pp_cell[1:]

    sheet = model.worksheet(sheetName)

    # update cells
    cells = [
        Cell.from_address(pp_cell, float(pp_value)),
        Cell.from_address(etp_cell, float(etp_value)),
        Cell.from_address(cdc_cell, float(cdc_value)),
        Cell.from_address(pmp_cell, float(pmp_value)),
        Cell.from_address(da_cell, float(da_value)),
        Cell.from_address(cr_cell, float(cr_value))
    ]

    sheet.update_cells(cells)

    # outout
    lr = sheet.acell('J{}'.format(table_row)).value
    fr = sheet.acell('K{}'.format(table_row)).value
    nr = sheet.acell('M19').value

    return {"lr": lr, "fr": fr, "nr": nr}


if __name__ == '__main__':
    inference({})
